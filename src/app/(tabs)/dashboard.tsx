import { useBle, useHR } from "@/context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { Asset } from "expo-asset";
import { ExpoWebGLRenderingContext, GLView } from "expo-gl";
import { useRouter } from "expo-router";
import { Renderer, loadAsync } from "expo-three";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Switch } from "react-native-paper";
import * as THREE from "three";
import { Cards, CustomButton, Header, Loading, WrapperMain } from "../../component";

export default function Dashboard() {
  const router = useRouter();
  const { currentHR, resetStorage } = useHR();
  const { connectedDeviceName, isLoadingConnected } = useBle();

  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  // Ref agar nilai terbaru dapat dibaca langsung di dalam animation loop WebGL
  const currentHRRef = useRef(currentHR);
  const isSwitchOnRef = useRef(isSwitchOn);

  useEffect(() => {
    currentHRRef.current = currentHR;
  }, [currentHR]);

  useEffect(() => {
    isSwitchOnRef.current = isSwitchOn;
  }, [isSwitchOn]);

  // Fungsi Inisialisasi WebGL & Scene 3D
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2.5;

    // 2. Renderer Setup (Menggunakan Renderer expo-three dari three@0.162.0)
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Background transparan

    // 3. Pencahayaan (Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    try {
      // 4. Load Asset Model GLB Jantung
      const asset = Asset.fromModule(require("../../../assets/images/realistic_human_heart.glb"));
      await asset.downloadAsync();

      // Passing asset.uri atau objek asset yang sudah di-download
      const gltf = await loadAsync(asset.uri || asset);
      const model = gltf.scene || gltf;

      // Atur skala dasar dan posisi awal model
      const baseScale = 1.0;
      model.scale.set(baseScale, baseScale, baseScale);
      model.position.set(0, 0, 0);
      scene.add(model);

      // 5. Animation Loop
      let animationFrameId: number;
      const clock = new THREE.Clock();

      const render = () => {
        animationFrameId = requestAnimationFrame(render);
        const elapsedTime = clock.getElapsedTime();

        // --- A. Logika Detak Jantung (Heartbeat Scale) ---
        const rawHr = Number(currentHRRef.current);
        const hr = Number.isFinite(rawHr) && rawHr > 0 ? rawHr : 60;
        const bps = hr / 60;

        // Efek denyut jantung menggunakan kombinasi gelombang sinus
        const beatFactor = Math.pow(Math.sin(elapsedTime * bps * Math.PI), 4) * 0.12;
        const currentScale = baseScale + beatFactor;
        model.scale.set(currentScale, currentScale, currentScale);

        // --- B. Logika Auto Rotate ---
        if (isSwitchOnRef.current) {
          model.rotation.y += 0.015;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      render();

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } catch (error) {
      console.error("Gagal memuat 3D model jantung:", error);
    }
  };

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
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
              <Text className="text-3xl text-white font-normal">HUBUNGKAN{"\n"}SMARTWATCH</Text>
            </View>
          </CustomButton>
          <Text className="text-normal text-white font-light">
            DEVICE: <Text className="font-semibold">{connectedDeviceName ? connectedDeviceName : "-"}</Text>
          </Text>
        </Header>

        {/* FLEX 2: CARDS CONTENT  */}
        <View className="flex flex-col gap-2 mt-4">
          {/* CARDS HR  */}
          <Cards className="flex flex-col gap-2">
            <Text className="text-label">HR SMARTWATCH</Text>

            {/* Info BPM  */}
            <View className="flex flex-row items-end justify-between">
              <Text className={`text-8xl ${connectedDeviceName && !isLoadingConnected ? "text-theme-green" : "text-gray-400"}`}>
                {currentHR}
                <Text className="text-normal font-normal text-black">bpm</Text>
              </Text>
              <Text className={`text-4xl pb-[4] ${connectedDeviceName && !isLoadingConnected ? "text-theme-green" : "text-gray-400"} font-semibold`}>NORMAL</Text>
            </View>

            <View className="border border-gray-400 " />

            {/* Riwayat HR  */}
            <View className="flex flex-col gap-2">
              <Text className="text-normal font-normal">
                RIWAYAT GANGGUAN: <Text className="text-theme-red font-bold">3</Text> KALI
              </Text>

              {/* Data 1 */}
              <View className="flex-row items-center gap-2 justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-theme-red" />
                  <Text className="text-xl">26/08/2026</Text>
                </View>
                <Text className="text-xl">10:00 WIB</Text>
              </View>

              {/* Data 2 */}
              <View className="flex-row items-center gap-2 justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-theme-red" />
                  <Text className="text-xl">26/08/2026</Text>
                </View>
                <Text className="text-xl">10:00 WIB</Text>
              </View>

              {/* Data 3 */}
              <View className="flex-row items-center gap-2 justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-theme-red" />
                  <Text className="text-xl">26/08/2026</Text>
                </View>
                <Text className="text-xl">10:00 WIB</Text>
              </View>

              <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_disorder")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </View>
          </Cards>

          {/* CARDS 3D */}
          <View className="flex flex-col gap-4 mt-4">
            <Cards className="flex flex-col gap-2">
              <Text className="text-label">MODEL JANTUNG</Text>

              {/* CONTENT  */}
              <View className="flex flex-col">
                <View className="w-full h-72 rounded-lg overflow-hidden justify-center items-center bg-gray-50/50">
                  <GLView style={{ width: "100%", height: "100%" }} onContextCreate={onContextCreate} />
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
