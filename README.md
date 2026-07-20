# Etkinlik, Bilet ve Rezervasyon Yönetim Paneli

Angular 17 (standalone components) ile geliştirilmiş, backend'e ihtiyaç duymayan
(localStorage üzerinde çalışan simüle edilmiş bir API katmanına sahip) bir
etkinlik / bilet / rezervasyon yönetim panelidir.
<img width="1900" height="908" alt="Ekran görüntüsü 2026-07-20 132529" src="https://github.com/user-attachments/assets/987258f5-20c7-4009-be89-0dd9125c470a" />


## Kurulum ve Çalıştırma

```bash
npm install
npm start        # ng serve — http://localhost:4200
npm test         # ng test — Karma/Jasmine birim testleri
npm run build    # production build -> dist/
```

> Kod, Angular 17 standalone API'lerine göre
> yazılmış ve statik olarak (TypeScript syntax/tip tutarlılığı) kontrol edilmiştir.
> `npm install` sonrası küçük paket sürümü uyumsuzlukları çıkarsa `package.json`
> içindeki `^17.3.0` sürümlerini kendi ortamınızdaki en güncel 17.x sürümüyle
> hizalamanız yeterlidir.

## Demo Kullanıcılar / Roller

Gerçek bir kimlik doğrulama sistemi yoktur. Üst bardaki açılır menüden 3 demo
kullanıcı arasında geçiş yapabilirsiniz:

|Kullanıcı|Rol|Yetkileri|
|-|-|-|
|Elif Yönetici|Etkinlik Yöneticisi|Tüm modüller: etkinlik/mekan/bilet tipi CRUD, raporlar, audit log|
|Barış Gişe|Gişe Operatörü|Rezervasyon oluşturma/onaylama/iptal, etkinlik/bilet görüntüleme|
|Deniz Kontrol|Kontrol Görevlisi|Check-in ekranı, etkinlik/rezervasyon görüntüleme|

Yetkisiz bir sayfaya `roleGuard` üzerinden erişim engellenir; menüde de
`appPermission` directive'i sayesinde yetkisi olmayan kullanıcıya ilgili
menü öğeleri hiç gösterilmez.
<img width="317" height="138" alt="Ekran görüntüsü 2026-07-20 132757" src="https://github.com/user-attachments/assets/63b57b88-f167-466e-b5f5-07982f735526" />


## Mimari Özeti

```
src/app/
  core/                 # Enum, base model, guard'lar ve uygulama geneli servisler
    models/              enums.ts, base-entity.model.ts
    services/            storage.service.ts (localStorage), mock-api.service.ts
                          (simüle edilmiş async CRUD API), audit-log.service.ts,
                          auth.service.ts (demo rol seçimi), notification.service.ts,
                          demo-data.service.ts (gerçekçi seed veri seti)
    guards/              auth.guard.ts, role.guard.ts, unsaved-changes.guard.ts

  shared/                Tüm feature'larda tekrar kullanılan bileşenler
    components/           data-table (arama/sıralama/sayfalama), confirm-dialog,
                           empty/loading/error state, kpi-card, status-badge, toast-host
    directives/            appPermission (rol bazlı görünürlük), appDebounceInput,
                           appAutofocus
    pipes/                 statusLabel, money, trDate, remainingTime
    validators/            maxCapacityValidator, positiveIntegerValidator,
                           dateRangeValidator, futureDateValidator, uniqueValueValidator

  features/
    venues/                Mekan ve salon kapasitesi yönetimi
    events/                Etkinlik yönetimi + kapasite kuralı (CapacityRule)
    ticket-types/          Bilet tipi yönetimi (fiyat, kontenjan, kategori)
    reservations/          Rezervasyon + katılımcı + iptal/iade
    check-in/               Manuel bilet kodu ile check-in simülasyonu
    dashboard/              Anlık hesaplanan KPI özet ekranı
    reports/                Detaylı gelir/doluluk/iptal raporları
    audit-log/              Kritik işlemlerin denetim kaydı

  layout/                 Sidebar + topbar (rol switcher)
```

### Veri katmanı nasıl çalışıyor?

Gerçek bir backend olmadığından `MockApiService<T>` adında generic bir servis,
`Observable` tabanlı, gerçekçi ağ gecikmesi (250-650ms) ve rastgele hata
enjeksiyonu (varsayılan %2-6) içeren bir "sahte API" katmanı sağlar. Bütün
CRUD işlemleri bu servis üzerinden yürür ve veriler `StorageService` aracılığıyla
tarayıcının `localStorage`'ında tutulur; sayfa yenilendiğinde veri kaybolmaz.

Uygulama ilk açıldığında `DemoDataService`, 4 mekan, 6 etkinlik (farklı
durumlarda: taslak, yayında, devam eden, tamamlanmış, iptal edilmiş), 12 bilet
tipi, 12 katılımcı ve 25+ rezervasyon (bekleyen/onaylı/check-in yapılmış/iptal/iade
karışık) içeren gerçekçi bir veri seti oluşturur. Verileri sıfırlamak isterseniz
tarayıcı konsolunda `localStorage.clear()` çalıştırıp sayfayı yenileyebilirsiniz.

## Karşılanan Kritik İş Kuralları

1. **Kapasite sınırı** — Bir etkinlikteki toplam onaylı+bekleyen+check-in
rezervasyon adedi, etkinliğin `CapacityRule.totalCapacity` değerini aşamaz
(`ReservationService.remainingEventCapacity`).
2. **Bilet tipi kontenjan toplamı** — Bir etkinliğe bağlı tüm bilet tiplerinin
kontenjanları toplamı, etkinliğin toplam kapasitesini aşamaz
(`TicketTypeService.validateQuota`).
3. **Fiyat kilidi** — `ONGOING` veya `COMPLETED` durumundaki bir etkinliğin
bilet tipi fiyatı değiştirilemez (`TicketTypeService.update`).
4. **Kontenjan iadesi** — Bir rezervasyon iptal edildiğinde, kalan kontenjan
hesaplamaları yalnızca aktif durumları (`PENDING/CONFIRMED/CHECKED\_IN`)
saydığı için kontenjan otomatik olarak geri açılır.
5. **Mükerrer check-in engeli** — Aynı bilet koduyla ikinci kez check-in
yapılamaz (`CheckInService.checkInByCode`, `DUPLICATE` hatası).
6. **Check-in ön koşulu** — Check-in yalnızca `CONFIRMED` durumundaki
rezervasyonlar için yapılabilir.
7. **Audit log** — Fiyat, kontenjan, iptal, check-in ve durum değişikliği gibi
kritik işlemler `AuditLogService` üzerinden kullanıcı/rol/tarih/eski-yeni
değer bilgisiyle kayıt altına alınır ve `/audit-log` sayfasında listelenir.
8. **Tanımlı durum geçişleri** — Hem etkinlik (`EVENT\_STATUS\_TRANSITIONS`) hem
rezervasyon (`RESERVATION\_STATUS\_TRANSITIONS`) durumları yalnızca izin
verilen sıradaki geçişlere göre değişebilir; rastgele geçiş `INVALID\_TRANSITION`
hatası döner.

## Birim Testleri

`ng test` ile çalıştırılabilecek testler `TestBed` + `fakeAsync/tick` kullanır
(simüle edilmiş ağ gecikmesini deterministik biçimde ilerletmek için) ve şunları
kapsar:

* `shared/validators/validators.spec.ts` — özel form validator'ları
* `core/services/audit-log.service.spec.ts` — audit log kaydı ve reaktif signal
* `features/events/services/event.service.spec.ts` — kapasite/mekan doğrulaması,
durum geçiş kuralları
* `features/ticket-types/services/ticket-type.service.spec.ts` — kontenjan
toplamı doğrulaması, fiyat kilidi kuralı
* `features/reservations/services/reservation.service.spec.ts` — kapasite
aşımı reddi, iptalde kontenjan iadesi, geçersiz durum geçişi reddi
* `features/check-in/services/check-in.service.spec.ts` — yalnızca onaylı
rezervasyon check-in kuralı, mükerrer check-in engeli

## Bilinen Sınırlamalar

* Gerçek bir kimlik doğrulama/oturum yönetimi yoktur; rol seçimi demo amaçlıdır.
* Backend olmadığından tüm veriler tarayıcı `localStorage`'ında tutulur; farklı
tarayıcı/cihazlar arasında senkronize olmaz.
* QR kod okuma yerine manuel bilet kodu girişi simüle edilmiştir.
* Bu ortamda `npm install`/`ng build` çalıştırılamadığından derleme, yalnızca
TypeScript syntax/tip tutarlılığı düzeyinde statik olarak doğrulanmıştır;
ilk `npm install` sonrası küçük paket-sürüm uyuşmazlıkları görürseniz
`package.json`'daki sürümleri güncelleyin.

