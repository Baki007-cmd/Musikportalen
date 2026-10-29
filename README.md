# Musikportalen – åk 3–9

En första prototyp för musikundervisning i årskurs 3–9, med svenska instruktioner och övningar för gitarr, rytm och musikteori.

## Testa lokalt
Öppna `index.html` i en webbläsare. Ingen installation behövs.

## Funktioner i första versionen
- Årskursval (3–9) och ämnesområden.
- Gitarrövning: G–D–Am eller G–D–C; två slag på G och D, fyra på Am/C.
- Justerbar puls med visuellt stöd och klickljud.
- Ett kunskapstest om puls.

## Google Workspace-inloggning – nästa fas
Inloggningen är **inte** aktiverad. Knappen på sidan är endast en informationsknapp. Ingen databas, elevprofil eller sparande av resultat finns i prototypen.

Planerad arkitektur: React + TypeScript, Google Workspace-federerad autentisering (möjligen Firebase Authentication), serverbaserad rollkontroll, databas med strikt åtkomstkontroll, och säker hosting.

**Innan elevkonton används:** Skolans huvudman måste godkänna tredjepartstjänst, personuppgiftsbehandling, eventuella personuppgiftsbiträdesavtal och kontointegration. Kontroll av skolans e-postdomän i klienten räcker inte som säkerhet. Lärarbehörigheter får inte tilldelas av användaren själv. Lagra aldrig elevers personuppgifter eller hemliga nycklar i GitHub.

## Versionshantering
Detta är en avsiktligt publikfri prototyp vad gäller personuppgifter: inga elevuppgifter lagras. Projektets GitHub-repository kan däremot vara offentligt; byt till privat om intern information ska ingå.
