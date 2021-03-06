# OVERHAUL IN PROGRESS!!!

# Gmail Schedule It
"Schedule sending of messages" is one of the top requested feature in Gmail. 
Now Gmail ScheduleIt can help you schedule outgoing messages and it can be used with Gmail / Google apps for business.


## Features
- Private - All your emails are private, unlike third party subscription programs that need access to your entire Gmail account with read and write access.
- 100% free - No ads, No limits (Only standard Gmail outgoing limits apply).
- Open source - [Link to source https://github.com/kennethscott/GmailScheduleIt](https://github.com/kennethscott/GmailScheduleIt)
- The app is hosted on Google servers with Google app script. 

Further, you can help contribute and make it better. Please send us your feedback and any issues can be posted on the [Issue Tracker](https://github.com/kennethscott/GmailScheduleIt/issues)

## Usage
Quick initial set up
- [Click to open Gmail Schedule It](https://script.google.com/macros/s/AKfycbzTcxE3LbS5JRFIs9OF1Cyx5njXxSbaRWrni2V7Gbpc_uazneI/exec)
- Accept permissions
- Create labels as required. Feel free to add as many as you like. A pro tip is to use "2 hours later" then for days use "two days later" and so on. This means that 2 will show on the labels above two and so on. This will help make selecting the schedule easier.

Outgoing messages
- Now you are all set and go back to gmail and compose a message and add the label under timer as required.
- Do not click on the send button. Only set the label and then leave the message in drafts.

Returning messages to inbox
- Another useful feature is to allow gmail to return messages back to inbox.
- Simply apply a label under timer to any of our message and it will be returned back to your inbox as per schedule.

Accessing your Gmail Schedule It settings:
- https://script.google.com/macros/s/AKfycbzTcxE3LbS5JRFIs9OF1Cyx5njXxSbaRWrni2V7Gbpc_uazneI/exec

## Troubleshooting
1) Cannot connect to Gmail
- You might occasionally see an error that looks like the image below.
[![ErrorWithGmail](http://i.imgur.com/CNZAWhI.png)](http://i.imgur.com/CNZAWhI.png)
- The message above means that Gmail could not connect to Google app scripts. This weird timeout happens between google services and you can ignore these messages. Any queued messages will be sent out in the next run.
- Please set a gmail filter to delete these messages. You can filter on messages with subject "Summary of failures for Google Apps Script: Gmail Scheduler" sent from: 	apps-scripts-notifications@google.com

2) Uninstalling Gmail Schedule It
- It is quite easy to uninstall Gmail ScheduleIt at any time. 
- Simply visit the https://script.google.com/macros/s/AKfycbzTcxE3LbS5JRFIs9OF1Cyx5njXxSbaRWrni2V7Gbpc_uazneI/manage/uninstall
- Click on Uninstall (You can always follow the initial setup again to reinstall the scheduler)

3) Error: Service using too much computer time for one day
- This is a recent change with Gmail resource utilisation around mid 2016. Please uninstall and install app again to use lesser resources on Gmail.

## Further support & updates
- We look forward to your feedback on how we can improve this system
- Your commits and code updates are welcome. Looking forward to all the pull requests :)

### License
Gmail Schedule It is licensed under the [MIT license](https://github.com/kennethscott/GmailScheduleIt/blob/master/LICENSE.txt). Maintained by Kenneth Scott

