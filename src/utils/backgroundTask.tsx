import BackgroundService from "react-native-background-actions";

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export const backgroundOptions = {
  taskName: "SmartwatchHR",
  taskTitle: "Memantau Detak Jantung",
  taskDesc: "Terhubung dengan smartwatch di background...",
  taskIcon: {
    name: "ic_launcher",
    type: "mipmap",
  },
  color: "#017BFE",
  // linkingURI: 'yourappscheme://', // klik in-app
  parameters: {
    delay: 1000,
  },
};

export const backgroundTask = async (taskDataArguments: any) => {
  await new Promise(async (resolve) => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      await sleep(taskDataArguments.delay);
    }
    resolve(undefined);
  });
};
