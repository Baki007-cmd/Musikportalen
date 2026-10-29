# Testplan för flera lärare

Testa i Firebase Emulator Suite innan driftsättning.

1. Ej inloggad: kan inte läsa eller skriva teachers eller lessons.
2. Inloggad men inte godkänd: kan inte läsa eller skriva.
3. Godkänd lärare A: kan läsa och skriva endast egna lessons.
4. Godkänd lärare B: kan inte läsa eller skriva A:s lessons.
5. Lärare A: kan inte ändra sitt eget active-värde.
6. Inaktiverad lärare: förlorar läs- och skrivrättigheter.
7. Ogiltiga fält, fel datatyper och överlånga texter nekas.
8. Klienten hanterar utloggning, nätverksfel och nekad åtkomst utan att visa data.
9. Testa med påhittade data; inga elevuppgifter.
10. Kontrollera dataskyddsbeslut, lagringsregion, gallring och behörig administrativ process innan verklig användning.

Obs: Detta är en testplan, inte ett påstående om att testerna är körda.
