import { useBle, useHR } from "@/context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Switch } from "react-native-paper";
import { WebView } from "react-native-webview";
import { Button, Cards, CustomButton, Header, Loading, WrapperMain } from "../../component";

export default function Dashboard() {
  const router = useRouter();

  // Menggunakan data global dari HR Context
  const { currentHR, simulateStatus, displayStatus, setSimulateStatus } = useHR();
  const { connectedDeviceName, isLoadingConnected } = useBle();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [modelBase64, setModelBase64] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);

  const onToggleSwitch = () => {
    setIsSwitchOn((previous) => !previous);
  };

  // 1. Load file GLB lokal dan ubah ke Base64 untuk dikirim ke WebView
  useEffect(() => {
    const loadModelBase64 = async () => {
      try {
        const asset = Asset.fromModule(require("../../../assets/images/realistic_human_heart.glb"));
        await asset.downloadAsync();

        const uri = asset.localUri || asset.uri;
        if (uri) {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          setModelBase64(base64);
        }
      } catch (error) {
        console.error("Gagal membaca file GLB ke Base64:", error);
      }
    };

    loadModelBase64();
  }, []);

  // 2. Kirim update Heart Rate dan status Rotasi ke WebView secara dinamis
  useEffect(() => {
    if (webViewRef.current) {
      const data = JSON.stringify({
        hr: currentHR,
        isRotating: isSwitchOn,
      });
      webViewRef.current.postMessage(data);
    }
  }, [currentHR, isSwitchOn]);

  // 3. HTML Template untuk WebView
  const htmlContent = useMemo(() => {
    if (!modelBase64) return "";
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { width: 100%; height: 100%; overflow: hidden; background-color: #f5f5f5; }
          #canvas-container { width: 100%; height: 100%; background-color: #f5f5f5; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
      </head>
      <body>
        <div id="canvas-container"></div>
        <script>
          let scene, camera, renderer, heartGroup, clock;
          let currentHR = ${currentHR};
          let isRotating = ${isSwitchOn};

          function init() {
            const container = document.getElementById('canvas-container');
            const width = container.clientWidth;
            const height = container.clientHeight;

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf5f5f5);

            camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
            camera.position.set(0, 0, 5);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0xf5f5f5, 1);
            container.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
            scene.add(ambientLight);

            const keyLight = new THREE.DirectionalLight(0xffffff, 3);
            keyLight.position.set(5, 5, 5);
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
            fillLight.position.set(-5, 2, 3);
            scene.add(fillLight);

            const loader = new THREE.GLTFLoader();
            const binaryString = atob("${modelBase64}");
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            loader.parse(bytes.buffer, '', (gltf) => {
              const model = gltf.scene;
              const box = new THREE.Box3().setFromObject(model);
              const size = new THREE.Vector3();
              box.getSize(size);

              const maxDim = Math.max(size.x, size.y, size.z);
              const scaleBase = maxDim > 0 ? 2.5 / maxDim : 1;
              model.scale.set(scaleBase, scaleBase, scaleBase);

              const center = new THREE.Vector3();
              box.getCenter(center);
              model.position.sub(center.multiplyScalar(scaleBase));

              heartGroup = new THREE.Group();
              heartGroup.add(model);
              scene.add(heartGroup);

              camera.lookAt(0, 0, 0);

              clock = new THREE.Clock();
              animate();
            });
          }

          function animate() {
            requestAnimationFrame(animate);

            if (clock && heartGroup) {
              const elapsedTime = clock.getElapsedTime();

              if (currentHR > 0) {
                const bps = currentHR / 60;
                const beatFactor = Math.pow(Math.sin(elapsedTime * bps * Math.PI), 4) * 0.12;
                const scale = 1 + beatFactor;
                heartGroup.scale.set(scale, scale, scale);
              }

              if (isRotating) {
                heartGroup.rotation.y += 0.01;
              }
            }

            renderer.render(scene, camera);
          }

          function handleMessage(dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (data.hr !== undefined) currentHR = Number(data.hr);
              if (data.isRotating !== undefined) isRotating = Boolean(data.isRotating);
            } catch (e) {}
          }

          document.addEventListener('message', (e) => handleMessage(e.data));
          window.addEventListener('message', (e) => handleMessage(e.data));

          window.onload = init;
        </script>
      </body>
    </html>
  `;
  }, [modelBase64]);

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* HEADER */}
        <Header>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-4xl font-light">
              Hallo, <Text className="font-semibold">John Doe</Text>
            </Text>
            {/* <Pressable className="active:opacity-40" onPress={() => router.navigate("/dashboard_profile")}>
              <MaterialDesignIcons name="cog-outline" size={35} color="#FFFFFF" />
            </Pressable> */}
          </View>

          <Text className="text-normal text-white font-light">john_doe@gmail.com</Text>

          <CustomButton onPress={() => router.navigate("/dashboard_smartwatch")} buttonColor="#DB3546" borderRadius={10}>
            <View className="flex flex-row items-center gap-2">
              <MaterialDesignIcons name="watch-import" size={40} color="#FFFFFF" />
              <Text className="text-3xl text-white font-normal">
                HUBUNGKAN{"\n"}
                SMARTWATCH
              </Text>
            </View>
          </CustomButton>

          <Text className="text-normal text-white font-light">
            DEVICE: <Text className="font-semibold">{connectedDeviceName ? connectedDeviceName : "-"}</Text>
          </Text>
        </Header>

        {/* CONTENT */}
        <View className="flex flex-col gap-2 mt-4">
          <Cards className="flex flex-col gap-2">
            <Text className="text-label">HR SMARTWATCH</Text>
            <View className="flex flex-row items-end justify-between">
              <Text className={`text-6xl font-semibold ${displayStatus !== "-" && connectedDeviceName && !isLoadingConnected ? (displayStatus === "NORMAL" ? "text-theme-green" : "text-red-400") : "text-gray-400"}`}>
                {currentHR}
                <Text className="text-normal font-normal text-black">bpm</Text>
              </Text>

              {/* Tampilkan displayStatus di sini */}
              <Text className={`text-3xl font-light pb-[4] ${displayStatus !== "-" && connectedDeviceName && !isLoadingConnected ? (displayStatus === "NORMAL" ? "text-theme-green" : "text-red-400") : "text-gray-400"}`}>{displayStatus}</Text>
            </View>
          </Cards>

          {/* 3D HEART MODEL VIA WEBVIEW */}
          <View className="flex flex-col gap-4 mt-4 mb-10">
            <Cards className="flex flex-col gap-3">
              <Text className="text-label">MODEL JANTUNG</Text>
              <View className="flex flex-col">
                <View className="w-full h-72 rounded-lg overflow-hidden bg-[#F5F5F5]">
                  {modelBase64 ? (
                    <WebView ref={webViewRef} originWhitelist={["*"]} source={{ html: htmlContent }} style={{ flex: 1, backgroundColor: "#F5F5F5" }} containerStyle={{ backgroundColor: "#F5F5F5" }} scrollEnabled={false} javaScriptEnabled={true} domStorageEnabled={true} renderToHardwareTextureAndroid={false} />
                  ) : (
                    <View className="flex-1 justify-center items-center">
                      <Text className="text-gray-500">Memuat model 3D...</Text>
                    </View>
                  )}
                </View>

                <View className="flex-1 flex flex-row justify-between items-center mt-3">
                  <Text className="text-normal font-semibold">Rotasi Otomatis</Text>
                  <Switch color="#017BFE" value={isSwitchOn} onValueChange={onToggleSwitch} />
                </View>
              </View>
            </Cards>

            {/* SIMULASI GANGGUAN JANTUNG */}
            <Cards className="flex flex-col gap-3">
              <Text className="text-label">{`SIMULASI GANGGUAN\nJANTUNG`}</Text>
              <View className="flex flex-col gap-2 justify-center items-center mt-2">
                <Button mode={simulateStatus === "NORMAL" ? "contained" : "outlined"} className="w-full" onPress={() => setSimulateStatus("NORMAL")}>
                  <Text style={{ color: simulateStatus === "NORMAL" ? "#fff" : "#038175" }}>NORMAL</Text>
                </Button>
                <Button mode={simulateStatus === "TAKIKARDIA" ? "contained" : "outlined"} className="w-full" onPress={() => setSimulateStatus("TAKIKARDIA")}>
                  <Text style={{ color: simulateStatus === "TAKIKARDIA" ? "#fff" : "#038175" }}>TAKIKARDIA</Text>
                </Button>
                <Button mode={simulateStatus === "BRADIKARDIA" ? "contained" : "outlined"} className="w-full" onPress={() => setSimulateStatus("BRADIKARDIA")}>
                  <Text style={{ color: simulateStatus === "BRADIKARDIA" ? "#fff" : "#038175" }}>BRADIKARDIA</Text>
                </Button>
              </View>
            </Cards>
          </View>
        </View>
      </View>

      <Loading visible={isLoadingConnected} />
    </WrapperMain>
  );
}
