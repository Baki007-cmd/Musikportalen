# Flerlärarstöd – utvecklingsplan

## Mål
Flera godkända lärare på Apelgårdsskolan ska kunna logga in med egna Google Workspace-konton och använda en personlig digital lektionsplanerare.

## Roller och åtkomst
- Administratör: godkänner och avaktiverar lärarkonton via privilegierad administration.
- Lärare: kan läsa, skapa, redigera och ta bort enbart sina egna planeringar.
- Kollegial delning: planerad framtida funktion, inte implementerad. Delning ska vara frivillig, explicit och återkallelig. Inga planeringar ska bli delade som standard.

## Nuvarande implementation
- Datamodell: teachers/{uid} med active=true; teachers/{uid}/lessons/{lessonId}.
- Inloggning: Firebase Authentication med Google som identitetsleverantör, kräver konfiguration.
- Firestore-regler begränsar åtkomsten till aktiv lärare och eget uid.
- Ingen administratörspanel eller delningsfunktion finns ännu.
- Inga riktiga elevuppgifter får användas i prototypen.

## Föreslagna etapper
1. Huvudmannens godkännande av tjänst, dataskydd, avtal, lagringsregion, gallring och Workspace-integration.
2. Säker testmiljö med minst två lärartestkonton och ett obehörigt testkonto.
3. Behörighetsadministration via privilegierad serverfunktion med granskningslogg.
4. Granskning av Firestore-regler, autentisering, säkerhetskopiering och återställning.
5. Delningsmodell: separat delad kopia eller explicit behörighetslista per planering, med möjlighet att återkalla delning och utan implicit gruppåtkomst.
6. Pilot med lärare, utan personidentifierbara elevuppgifter, därefter utvärdering.

## Viktigt
GitHub-repositoryt är offentligt vid skrivtillfället. Lägg aldrig in personuppgifter, inloggningshemligheter eller privata nycklar. Även i privat repo behövs korrekt åtkomstkontroll.
