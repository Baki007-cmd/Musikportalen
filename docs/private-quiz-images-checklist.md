# Privat bildåtkomst för Klassrumsquiz – inför driftsättning

Den här grenen är en förberedelse. Slå **inte** ihop den med main eller ändra bucketen förrän testerna är klara.

## Krävs i Vercel
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY (hemlig, endast server; får aldrig ligga i frontend eller GitHub)

## Säkerhet och test
1. Verifiera att `classroom_quiz_action('student', {token})` ger endast aktuell fråga för en giltig deltagartoken och avvisar utgångna token.
2. Verifiera att läraren bara kan få bildlänkar till sin egen användarmapp.
3. Verifiera att en elev kan se bilden i sin aktuella fråga men inte bilder från andra quiz eller andra lärare.
4. Verifiera att bildvisning fungerar när bucketen är PRIVATE, även på elevens mobil utan inloggning.
5. Kontrollera Storage-policy `portal_teacher_storage`: den breda ALL-regeln behöver begränsas eller tas bort efter kontroll av övriga användningsfall. Granska också quizbildens SELECT-policy och förhindra direkta läsningar som kringgår deltagarkontrollen.
6. Säkerställ att `classroom-quiz-images` inte längre är public; kontrollera att gamla publika länkar nekas. Externa bild-URL:er som läraren anger själv ligger utanför denna bucket.
7. Verifiera att äldre sparade quiz med publika Supabase-URL:er fungerar via konvertering av URL till sökväg.
8. Testa felhantering, rate limiting, och att inaktiva quiz inte ger åtkomst.

OBS: Signerade URL:er är delbara under giltighetstiden (60 sekunder). De ger inte absolut kopieringsskydd. Ändra inte bucketen innan serverfunktionen är deployad och testad.

Den här ändringen har inte körts mot den verkliga databasen och innebär inte att RLS eller Storage-reglerna är verifierade.
