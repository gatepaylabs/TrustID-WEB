import { Injectable } from "@angular/core";
import { map,mergeMap } from "rxjs/operators";
import {
  BrowserWebBluetooth,
  ConsoleLoggerService,
  BluetoothCore
} from "@manekinekko/angular-web-bluetooth";
import { pipe, merge } from 'rxjs';

type ServiceOptions = {
  characteristic: string;
  service: string;
  decoder(value: DataView): number | { [key: string]: number };
};

export function makeSingleton() {
  return [
    {
      provide: BluetoothCore,
      useFactory: (b, l) => new BluetoothCore(b, l),
      deps: [BrowserWebBluetooth, ConsoleLoggerService]
    },
    {
      provide: BluetoothService,
      useFactory: b => new BluetoothService(b),
      deps: [BluetoothCore]
    }
  ];
}

@Injectable({
  providedIn: "root"
})
export class BluetoothService {
  private _config: ServiceOptions;
  constructor(public ble: BluetoothCore) {}

  config(options: ServiceOptions) {
    this._config = options;
  }

  getDevice() {
    return this.ble.getDevice$();
  }

  getDeviceList(){
    return this.ble
    .discover({
      acceptAllDevices: true,
      optionalServices: [this._config.service]
    })
  }

  stream() {
    return this.ble.streamValues$().pipe(map(this._config.decoder));
  }

  value(){
    var options = {
      service : this._config.service,
      characteristic : this._config.characteristic
    }
    return this.ble.value$(options);
  }
  
  readValue() {
    console.log('Reading data...');

    return this.ble

        // 1) call the discover method will trigger the discovery process (by the browser)
        .discover$({
          acceptAllDevices: true,
          optionalServices: [this._config.service]
        })
        .pipe(

          // 2) get that service
          mergeMap((gatt: BluetoothRemoteGATTServer) => {
            return this.ble.getPrimaryService$(gatt, this._config.service);
          }),

          // 3) get a specific characteristic on that service
          mergeMap((primaryService: BluetoothRemoteGATTService) => {
            return this.ble.getCharacteristic$(primaryService, this._config.characteristic);
          }),

          // 4) ask for the value of that characteristic (will return a DataView)
          mergeMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
            return this.ble.readValue$(characteristic);
          }),
           
          // 5) on that DataView, get the right value
          map((value: DataView) => value.getUint8(0))
        )
  }

  getPrimaryService(gatt: BluetoothRemoteGATTServer){
    return this.ble.getPrimaryService$(gatt,this._config.service);
  }

  writeValue() {
    console.log('Write data...');

    return this.ble

        // 1) call the discover method will trigger the discovery process (by the browser)
        .discover$({
          acceptAllDevices: true,
          optionalServices: [this._config.service]
        })
        .pipe(
          // 2) get that service
          mergeMap((gatt: BluetoothRemoteGATTServer) => {
            return this.ble.getPrimaryService$(gatt, this._config.service);
          }),

          // 3) get a specific characteristic on that service
          mergeMap((primaryService: BluetoothRemoteGATTService) => {
            return this.ble.getCharacteristic$(primaryService, this._config.characteristic);
          }),

          // 4) ask for the value of that characteristic (will return a DataView)
          mergeMap((characteristic: BluetoothRemoteGATTCharacteristic) => {
            var value = Uint8Array.of(1);
            return this.ble.writeValue$(characteristic,value);
          }),
        )
  }

  onCharacteristicChanged(event:Event){
    return this.ble.onCharacteristicChanged(event);
  }

   disconnectDevice() {
     this.ble.disconnectDevice();
   }
}