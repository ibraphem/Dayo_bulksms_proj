import { Component, OnInit } from '@angular/core';
import { FileChooser } from '@ionic-native/file-chooser/ngx';
import { File } from '@ionic-native/file/ngx'
import { Papa } from 'ngx-papaparse';
import { FilePath } from '@ionic-native/file-path/ngx'
import { SMS } from '@ionic-native/sms/ngx';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  constructor(private fileChooser: FileChooser, private file: File, private papa: Papa, private filePath: FilePath, private sms: SMS, private toastController: ToastController, private storage:Storage ) { 
    this.setContacts = this.setContacts.bind(this)
    this.parseCsv = this.parseCsv.bind(this)
  }
  excelPath: '';
  csvString;
  parsedContacts:[];
  message: '';
  includeName: boolean = false;
  templates;
  sendStatus: any[] = []

  ngOnInit() {
    //get all templates
    this.storage.get('Templates')
        .then((result) => {
          let templates = JSON.parse(result)
          console.log(templates)
          this.templates = templates
        })
  }

  updateIncludeName() {
    // let nameCheck = this.includeName
    // this.includeName  = !nameCheck
    console.log(this.includeName)
  }


  async send() {

    await Promise.all(this.parsedContacts.map(async (contact, index) => {
      
      let rawPhone = contact['Phone Number']
      // console.log(rawPhone)
      let phone = this.padder(rawPhone)
      
      let content
  
      //Get the message and prepare based on include name check
      if (this.includeName == true) {
        content = 'Dear '+contact['Firstname']+', '+this.message
      }

      if (this.includeName == false) {
        content = this.message
      }
      
     await this.sms.send( phone, content)
          .then((response) => {
            console.log(response)
            let status = {}
            status['Phone'] = phone
            status['Status'] = response
            this.sendStatus.push(status)
            
          })
          .catch(err => console.log(err))
    }))

    console.log(this.sendStatus)
    console.log('no more iterations')
  }

  padder(phoneNumber) {
    //convert to string
    let phone = phoneNumber.toString()
    //check the length of the phone number
    if (phone.length == 11) {
      return phone
    }

    if(phone.length == 10) {
      //This is a high chance that it is missing
      //the leading 0. 
      //Pad the  0
      let phone = '0'+phoneNumber
      return phone
    }
  }

  setContacts(contacts) {
    console.log(contacts.data)
    contacts.data.pop()
    this.parsedContacts = contacts.data
    let contactCount = contacts.data.length
    this.presentToastWithOptions(contactCount)
  } 

  async presentToastWithOptions(count) {
    const toast = await this.toastController.create({
      message: count+' contacts found!',
      showCloseButton: true,
      position: 'bottom',
      closeButtonText: 'Done'
    });
    toast.present();
  }

  parseCsv(){
    
    this.papa.parse(this.csvString, {
      header: true,
      complete: this.setContacts
    })
  }


  readCsvFile() {

    let modifiedPath = this.excelPath.substring(0, this.excelPath.lastIndexOf('/'));
    let fileName = this.excelPath.substring(this.excelPath.lastIndexOf('/')+1, this.excelPath.length);

    this.file.readAsText(modifiedPath, fileName)
        .then(result => {
          this.csvString = result
          this.parseCsv()
        })
    
  }

  setExcelPath(uri) {
    this.excelPath = uri
    this.readCsvFile()
  }

  openFileManager() {
    this.fileChooser.open()
        .then(uri => {
          this.setExcelPath(uri)
        })
        .catch(e => console.log(e));
  }
}
