# Supabase Storage – undervisningsmaterial

Denna funktion använder en **privat** Storage-bucket med namnet `undervisningsmaterial`. Webbplatsen skapar inte bucket automatiskt.

## Konfigurera i Supabase

1. Öppna Storage → New bucket.
2. Namn: `undervisningsmaterial`.
3. **Public bucket: OFF**.
4. Max file size: 20 MB. Tillåt PDF, Word, PowerPoint, PNG/JPEG, MP3/WAV (om MIME-typbegränsning används).
5. Skapa följande fyra RLS-regler i SQL Editor. Granska dem först och använd endast projektet Musikportalen.

```sql
create policy "materials_select_own"
on storage.objects for select to authenticated
using (bucket_id = 'undervisningsmaterial' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'undervisningsmaterial' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "materials_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'undervisningsmaterial' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

Ingen update-policy behövs: filer får inte skrivas över. Varje fil ligger under `<user-id>/<unikt-filnamn>`. Den publicerbara nyckeln kan ligga i frontend, men aldrig en service-role-nyckel. Åtkomst till filer måste styras av RLS, inte enbart av sidans inloggningskontroll.

**Begränsningar:** Funktionerna ska testas med fiktiva dokument innan produktionsanvändning. Inga elevuppgifter före godkännande av huvudman. Filer i Storage är separata från lektionsplaneringarna i databasen. Övriga demo-URL:er i projektet är ännu inte åtkomstskyddade. Åtkomst till detta filbibliotek är kontobaserad; separat administratörsgodkännande av användare är ännu inte implementerat.
