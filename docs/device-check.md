# Phone and laptop check

Run this on a real iPhone (and an Android phone if a friend has one) using the Vercel URL, then once on a laptop. The microphone only works over https, so a laptop's local address won't work on a phone. Note the phone model, iOS version and browser in your pull request.

## Website and app

1. Open the Vercel URL in Safari. The landing page loads; the three phones slide in once and stop (they don't move at all under Reduce Motion). Tap **Menu** in the top bar: the section links and **Open the app** appear, and the menu closes when you pick one. Tap **Open the app**: it opens Home (`/app`). Reload on `/app/notes`: the page loads, not a 404.
2. Tap Share → Add to Home Screen, then open it from the icon. It opens on **Home** (`/app`), not the landing page. Check the icon, the status bar area and the bottom bar above the home indicator.
3. Tap through Home, Notes, Study and Settings in the bottom bar. The raised Record button opens New session.

## Captions

4. On New session pick **Lecture**. Start live captions stays disabled until "Everyone agrees" is on. Deny the microphone prompt and check the message explains how to allow it. Allow it in Safari's website settings and start again.
5. Speak a few sentences. Captions appear within about 10 seconds, with typing dots while a clip is transcribed. The Listening capsule, timer and waveform move; the bottom bar is hidden.
6. Tap **Mark** once. VoiceOver (if on) says the moment was marked.
7. Switch to another app, then come back. The screen shows the microphone is off and a red message. Resume, speak, stop, then **Save**.
8. Check the screen didn't turn off while listening for more than a minute.

## Notes

9. With "Write notes with AI" on, notes appear as a document with Lecture sections (Summary, Key terms, Check yourself…). Tap a time pill: it jumps to that line in the Transcript tab. The marked moment is highlighted.
10. Edit the notes: bold a word, add a checklist item. Leave and come back: the edits are still there.
11. **Export → Copy for Google Docs**, then paste into a Google Doc: headings, lists and bold survive. **Export → Download Word file** opens in Word or Pages. **Print or save as PDF** shows only the document.
12. In **Ask AI**, try a question the transcript answers and one it doesn't.
13. **Study** shows cards from Key terms and Check yourself. "Got it" moves on; "Again" brings the card back at the end.

## Accessibility on the phone

14. **Larger Text:** Settings → Accessibility → Display & Text Size → Larger Text, drag to the largest. Reopen the site: all text is larger, nothing is cut off, nothing scrolls sideways. Bottom bar labels stop growing at a size where all five fit.
15. **VoiceOver:** swipe through each screen. Every button, switch, tab and toolbar button reads a clear name and state. Opening a screen reads its title. While listening, each new caption is read once; the typing dots are not.
16. **Increase Contrast and Reduce Transparency:** turn both on. The aura disappears, bars become solid, separators and secondary text darker.
17. **Reduce Motion:** turn it on. Words appear without the settle blur; the aura stops.
18. **Dark mode:** Settings → Appearance → Dark (or Match device). Everything stays readable, and reopening the app doesn't flash white first.
19. **Flash when the microphone stops:** turn it on in Settings, start captions, then lock the phone briefly. On return you see one flash and the red message.

## Laptop

20. At full width the app has a sidebar, and a session shows notes beside the transcript. Use only the keyboard: Tab reaches every control with a visible ring; arrow keys move within tabs, choices and the formatting toolbar; Escape closes sheets.

## Data

21. Close Safari completely and reopen. Sessions, notes edits and study progress are still there. Delete a session from **More actions → Delete session** and confirm it's gone.
