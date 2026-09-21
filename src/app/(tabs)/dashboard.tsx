import { useBle, useHR } from "@/context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Asset } from "expo-asset";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { useRouter } from "expo-router";
import { Renderer } from "expo-three";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Switch } from "react-native-paper";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Cards, CustomButton, Header, Loading, WrapperMain } from "../../component";

// Polyfill wajib untuk GLTFLoader di React Native
if (typeof ProgressEvent === "undefined") {
  (globalThis as any).ProgressEvent = class ProgressEvent {};
}

export default function Dashboard() {
  const router = useRouter();

  const { currentHR: rawCurrentHR } = useHR();
  const currentHR = typeof rawCurrentHR === "number" ? rawCurrentHR + 900 : 0;

  const { connectedDeviceName, isLoadingConnected } = useBle();

  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const onToggleSwitch = () => {
    setIsSwitchOn((previous) => !previous);
  };

  const currentHRRef = useRef(currentHR);
  const isSwitchOnRef = useRef(isSwitchOn);

  useEffect(() => {
    currentHRRef.current = currentHR;
  }, [currentHR]);

  useEffect(() => {
    isSwitchOnRef.current = isSwitchOn;
  }, [isSwitchOn]);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    let animationFrameId: number | null = null;

    try {
      console.log("WEBGL CONTEXT CREATED");

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;

      // 1. SCENE
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      // 2. CAMERA
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
      camera.position.set(0, 0, 5);

      // 3. RENDERER
      const renderer = new Renderer({ gl, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(1);

      // 4. LIGHTING
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 3);
      keyLight.position.set(5, 5, 5);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
      fillLight.position.set(-5, 2, 3);
      scene.add(fillLight);

      // 5. LOAD ASSET
      console.log("Loading heart model...");
      const asset = Asset.fromModule(require("../../../assets/images/realistic_human_heart.glb"));
      await asset.downloadAsync();

      const modelUri = asset.localUri || asset.uri;
      if (!modelUri) {
        throw new Error("URI model GLB tidak tersedia.");
      }

      // Ambil file lokal secara langsung sebagai ArrayBuffer
      const response = await fetch(modelUri);
      const arrayBuffer = await response.arrayBuffer();

      // 6. PARSE GLB (Gunakan .parse, bukan .load)
      const loader = new GLTFLoader();

      const gltf = await new Promise<any>((resolve, reject) => {
        loader.parse(
          arrayBuffer,
          "", // Path dikosongkan karena .glb tidak membutuhkan resource eksternal
          (result) => {
            console.log("GLB BERHASIL DIMUAT");
            resolve(result);
          },
          (error) => reject(error),
        );
      });

      const model = gltf.scene;

      // 7. NORMALISASI UKURAN DAN PEMUSATAN MODEL
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      // Menyesuaikan ukuran model agar pas di layar (patokan ukuran ~2.5)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleBase = maxDim > 0 ? 2.5 / maxDim : 1;
      model.scale.set(scaleBase, scaleBase, scaleBase);

      // Menengahkan model ke titik (0,0,0)
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center.multiplyScalar(scaleBase));

      // 8. GROUP UNTUK ANIMASI
      // Model dimasukkan ke dalam group agar animasi skala & rotasi tidak merusak nilai normalisasi awal
      const heartGroup = new THREE.Group();
      heartGroup.add(model);
      scene.add(heartGroup);

      camera.lookAt(0, 0, 0);

      // 9. ANIMATION LOOP
      const clock = new THREE.Clock();

      const render = () => {
        animationFrameId = requestAnimationFrame(render);
        const elapsedTime = clock.getElapsedTime();

        // ANIMASI HEARTBEAT
        const rawHr = Number(currentHRRef.current);
        let currentScale = 1;

        if (Number.isFinite(rawHr) && rawHr > 0) {
          const bps = rawHr / 60;
          const beatFactor = Math.pow(Math.sin(elapsedTime * bps * Math.PI), 4) * 0.12;
          currentScale = 1 + beatFactor;
        }

        // Terapkan skala detak jantung ke Group
        heartGroup.scale.set(currentScale, currentScale, currentScale);

        // AUTO ROTATION
        if (isSwitchOnRef.current) {
          heartGroup.rotation.y += 0.01;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      render();
      console.log("3D HEART BERHASIL DIINISIALISASI");

      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }

        // Cleanup memory
        model.traverse((object: any) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        renderer.dispose();
      };
    } catch (error) {
      console.error("GAGAL MEMUAT MODEL 3D JANTUNG", error);
    }
  };

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* HEADER */}
        <Header>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-4xl font-light">
              Hallo, <Text className="font-semibold">John Doe</Text>
            </Text>
            <Pressable className="active:opacity-40" onPress={() => router.navigate("/dashboard_profile")}>
              <MaterialDesignIcons name="cog-outline" size={35} color="#FFFFFF" />
            </Pressable>
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
              <Text className={`text-6xl font-semibold ${connectedDeviceName && !isLoadingConnected ? "text-theme-green" : "text-gray-400"}`}>
                {currentHR}
                <Text className="text-normal font-normal text-black">bpm</Text>
              </Text>
              <Text className={`text-4xl font-light pb-[4] ${connectedDeviceName && !isLoadingConnected ? "text-theme-green" : "text-gray-400"}`}>NORMAL</Text>
            </View>
            {/* 
            <View className="border border-gray-400" />
            <View className="flex flex-col gap-2">
              <Text className="text-normal font-normal">
                RIWAYAT GANGGUAN: <Text className="text-theme-red font-bold">3</Text> KALI
              </Text>
              {[1, 2, 3].map((item) => (
                <View key={item} className="flex-row items-center gap-2 justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-theme-red" />
                    <Text className="text-xl">26/08/2026</Text>
                  </View>
                  <Text className="text-xl">10:00 WIB</Text>
                </View>
              ))}
              <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_disorder")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" size={30} color="#DB3546" />
              </Pressable>
            </View> */}
          </Cards>

          {/* 3D HEART MODEL */}
          <View className="flex flex-col gap-4 mt-4 mb-10">
            <Cards className="flex flex-col gap-2">
              <Text className="text-label">MODEL JANTUNG</Text>
              <View className="flex flex-col">
                <View className="w-full h-72 rounded-lg overflow-hidden justify-center items-center bg-[#F5F5F5]">
                  <GLView style={{ flex: 1, width: "100%", height: "100%" }} onContextCreate={onContextCreate} />
                </View>
                <View className="flex-1 flex flex-row justify-between items-center mt-3">
                  <Text className="text-normal font-semibold">Rotasi Otomatis</Text>
                  <Switch color="#017BFE" value={isSwitchOn} onValueChange={onToggleSwitch} />
                </View>
              </View>
            </Cards>
          </View>
        </View>
      </View>

      <Loading visible={isLoadingConnected} />
    </WrapperMain>
  );
}
