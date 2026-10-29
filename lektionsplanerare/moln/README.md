# Musikportalen – molnplanerare (pilot)

**Inte driftsatt.** Detta är en teknisk prototyp med Google Authentication och Firestore. Den befintliga lokala lektionsplaneraren är oförändrad.

## Säkerhetskrav före driftsättning
1. Få skriftligt godkännande från skolans huvudman/IT/dataskyddsansvariga för vald leverantör, lagringsregion, avtal, uppgifter, gallring och eventuella överföringar.
2. Skapa ett separat Firebase-projekt enligt huvudmannens riktlinjer och aktivera Authentication (Google) samt Firestore. Begränsa auktoriserade domäner och konfigurera Workspace-administratörens tillåtelse för tredjepartsappen.
3. Publicera reglerna i `firestore.rules` och testa dem i Firebase Emulator Suite (obehörig, elevkonto, annan lärares dokument, tillåten lärare). Testa även klientens hantering av fel och inloggning.
4. Skapa `firebase-config.js` utifrån `firebase-config.example.js` med projektets webbkonfiguration. Lägg **aldrig** service account-nycklar eller privata nycklar i GitHub.
5. Med privilegierad administration (Admin SDK eller Firebase Console) skapa dokumentet `teachers/ANVANDARENS_FIREBASE_UID` med fältet `active: true`. Klienten kan inte tilldela lärarbehörighet. Låt endast behörig administratör göra detta.
6. Säkerställ att enbart godkända Google Workspace-konton kan använda tjänsten genom administrativ kontohantering och tilldelning av lärarbehörighet. E-postdomän ensam är inte en säker behörighetskontroll.
7. Driftsätt först i godkänd miljö med testkonton och testdata. Kontrollera att Firebase Auth-domänen och webbplatsens domän är auktoriserade.

## Datamodell
`teachers/{uid}`: aktiv lärarbehörighet, administreras utanför klienten.
`teachers/{uid}/lessons/{id}`: enbart den lärarens planeringar. Ingen åtkomst mellan lärare.

## Begränsningar
- Ingen elevinloggning, ingen klasskoppling, inga delade planeringar eller synkronisering med Google Classroom ännu.
- Ingen migrering av tidigare lokalt sparade planeringar är implementerad.
- Firebase-konfiguration, regler, tjänst och administrativ lärarbehörighet måste konfigureras innan inloggningen fungerar.
- GitHub-repositoryt är för närvarande offentligt. Ingen identifierbar elevinformation eller hemliga nycklar får läggas i projektet.
- Databasregler och klientkod behöver säkerhetsgranskas före verklig användning.
