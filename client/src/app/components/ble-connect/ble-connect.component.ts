import { Component, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { BluetoothService } from "../../services/bluetooth.service";
import {
  BluetoothCore,
  BrowserWebBluetooth,
  ConsoleLoggerService
} from "@manekinekko/angular-web-bluetooth";
import { ToastrService } from 'ngx-toastr';

const PROVIDERS = [
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

@Component({
  selector: 'ble-connect',
  templateUrl: './ble-connect.component.html',
  styleUrls: ['./ble-connect.component.scss']
})
export class BleConnectComponent implements OnInit {
  doctorPublicKey = "0x0001";
  value = null;
  device = null;
  testData = [];
  streamSubscription: Subscription;
  valuesSubscription: Subscription;
  deviceSubscription: Subscription;

  constructor(public service: BluetoothService, private toastrService: ToastrService) {
    service.config({
      decoder: (value: DataView) => new TextDecoder().decode(value),
      service: this.getCanonicalUUID(0x3131),
      characteristic: this.getCanonicalUUID(0x9A12)
    });
  }

  ngOnInit() {
    this.testData = [
      {name : "Blood Type - A + ", isSelected: true},
      {name : "Do not administer", isSelected:false}
    ];

    this.writeValue(this.doctorPublicKey);
   // this.streamValues();
    this.getDeviceStatus();
    //  this.requestValue();
  }

  getDevice() {
    return this.service.getDevice();
  }

  getDeviceStatus() {
    this.deviceSubscription = this.service.getDevice().subscribe(device => {
      this.device = device;
      if (device) {
        this.value = null;
      } else {
        // device not connected or disconnected
        this.value = null;
      }
    }, this.hasError.bind(this));
  }

  requestValue() {
    this.valuesSubscription = this.service
      .readValue()
      .subscribe(this.updateValue.bind(this), this.hasError.bind(this));
  }
  
  writeValue(value:any) {
    //var vl = JSON.stringify(value);
    this.service.writeValue(value).subscribe(this.streamValues.bind(this), this.hasError.bind(this));
  }

  streamValues() {
    console.log("here");
    this.streamSubscription = this.service.stream().subscribe(this.updateValue.bind(this), this.hasError.bind(this));
  }

  updateValue(value: any) {
    console.log(value);
    this.value = value;
  }

  disconnect() {
    this.service.disconnectDevice();
    this.deviceSubscription.unsubscribe();
    this.valuesSubscription.unsubscribe();
  }

  hasError(error: string) {
   this.toastrService.error(error);
  }

  getCanonicalUUID(uuid: string | number): string {
    if (typeof uuid === "number") uuid = uuid.toString(16);
    uuid = uuid.toLowerCase();
    if (uuid.length <= 8) uuid = ("00000000" + uuid).slice(-8) + "-0000-1000-8000-00805f9b34fb";
    if (uuid.length === 32) uuid = uuid.match(/^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/).splice(1).join("-");
    return uuid;
  }

  ngOnDestroy() {
    if(this.valuesSubscription){
      this.valuesSubscription.unsubscribe();
    }

    if(this.deviceSubscription){
      this.deviceSubscription.unsubscribe();
    }

    if(this.streamSubscription){
      this.streamSubscription.unsubscribe();
    }
  }

  updateObject(){
    // it will write for edit object and after sign.
  }

}