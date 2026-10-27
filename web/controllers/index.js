import DeviceController from "./device_controller.js"

// Register with: application.load(controllers)
export const controllers = [
  { identifier: "bridge--device", controllerConstructor: DeviceController }
]

export { DeviceController }
