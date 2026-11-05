// Plugins natifs exposés à mobile.html (chargé uniquement dans l'APK).
import { BleClient } from "@capacitor-community/bluetooth-le";
import { App } from "@capacitor/app";
window.BleClient = BleClient;
window.CapApp = App;   // App.getInfo() : version réellement installée sur l'appareil
