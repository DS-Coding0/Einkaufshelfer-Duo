# Einkaufshelfer-Duo
Kleines eigenes internes Projekt zum selfhosting einer Android basierten Anwendung zum Sharen eines Einkaufszettels inklusiv Google Login, WebSocket und Push-Benachrichtigungen

# Projektbeschreibung
Der Einkaufshelfer ist eine Android App auf Basis von Kotlin, welche einen Google Login beinhaltet sowie die Moeglichkeit User auf seine Einkaufliste einzuladen, die Einkaufsliste wird persistent in einer PostgreSQL Datenbank gespeichert und per WebSocket in Echtzeit aktualisiert.
Zusaetzlich gibt es eine Push-Benachrichtigung welche ueber Firebase ausgeloest wird.

# Architektur
| Komponente    | Technologie                      | Rolle                                              |
| ------------- | -------------------------------- | -------------------------------------------------- |
| Android App   | Kotlin + Jetpack Compose         | UI, Google Sign-In, WebSocket-Client, FCM-Push     |
| Backend API   | Node.js + Express + Socket.IO    | REST für CRUD, WebSockets für Echtzeit-Events      |
| Auth          | Google Sign-In (ID Token) + JWT  | Login, Sitzungsverwaltung                          |
| Push          | Firebase Cloud Messaging (FCM)   | Benachrichtigungen bei Listen-Änderungen           |
| Datenbank     | PostgreSQL 16 (Docker)           | Persistenz                                         |
| Reverse Proxy | Apache2 + Let's Encrypt          | HTTPS + WebSocket-Proxy für externe Erreichbarkeit |
| Hosting       | Raspberry Pi, Docker Compose     | Läuft dauerhaft, Subdomain zeigt auf den Pi        |

# REST-API (Express)
| Methode | Endpunkt             | Zweck                                 |
| ------- | -------------------- | ------------------------------------- |
| POST    | /api/auth/google     | ID-Token verifizieren, JWT ausstellen |
| GET     | /api/lists           | Meine Listen                          |
| POST    | /api/lists           | Liste erstellen                       |
| POST    | /api/lists/join      | Per Invite-Code beitreten             |
| GET     | /api/lists/:id/items | Artikel abrufen                       |
| POST    | /api/lists/:id/items | Artikel hinzufügen                    |
| PATCH   | /api/items/:id       | Artikel ändern/abhaken                |
| DELETE  | /api/items/:id       | Artikel löschen                       |
| POST    | /api/fcm/token       | FCM-Token registrieren                |

# WebSocket-Events (Socket.IO)
| Event         | Richtung        | Payload          |
| ------------- | --------------- | ---------------- |
| item:added    | Server → Client | {listId, item}   |
| item:updated  | Server → Client | {listId, item}   |
| item:deleted  | Server → Client | {listId, itemId} |
| member:joined | Server → Client | {listId, user}   |
| list:updated  | Server → Client | {listId, name}   |