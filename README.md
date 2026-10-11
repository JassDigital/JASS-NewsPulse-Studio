# JASS NewsPulse Studio v0.6

A desktop news and social-video research workspace built with Electron + React.

## v0.6 additions
- Unified research timeline showing saved headlines, social searches, notes, and collection entries in date order.
- Timeline filters for headlines/topics, social searches, and research notes.
- Click through to saved source links and edit notes directly from the timeline.
- Existing live RSS news, publisher/region/language/date filters, quick previews, notes, collections, and JSON backup/restore remain.

## Run on Windows PowerShell
Extract into a separate folder such as `D:\Github\JASS-NewsPulse-Studio-v0.6`, then:
```powershell
npm install
npm run dev
```

## Build frontend
```powershell
npm run build
```

## Notes
- Internet is required for live RSS headlines.
- The timeline is built from items saved in the app; it is not a complete external browsing history.
- Backups are JSON files and should be exported before restoring another archive.
- Source is prepared but should be smoke-tested on the target Windows machine.
