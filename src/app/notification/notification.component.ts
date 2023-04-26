import { Component } from '@angular/core';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})

export class NotificationComponent {
  constructor() { }
  message: string = "";

  showNotification(success: boolean, amount: number, token: string) {
    if (success) {
      this.message = `Successfully bought ${amount} ${token}!`;
    } else {
      this.message = `Failed to buy ${amount} ${token}!`;
    }
  }
}
