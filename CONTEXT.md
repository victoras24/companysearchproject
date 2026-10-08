# KYCy

The web app for searching the Cyprus company registry: finding organisations and their officials, viewing their details, saving and tracking them.

## Language

### Registry

**Organisation**:
An entity recorded in the Cyprus company registry, of any organisation type. The interface labels it "Company".
_Avoid_: Company (outside interface text)

**Official**:
A person or organisation holding a position in an organisation.

**Organisation type**:
The registry's kind of organisation: C (Εταιρεία, company), B (Εμπορική Επωνυμία, business name), P (Συνεταιρισμός, partnership), O (Αλλοδαπή Εταιρεία, overseas company) or N (Συνεταιρισμός (BN)). The registry numbers each type separately, so a registration number names one organisation only together with its type.

**Organisation record**:
An organisation together with its registered address and officials, found by organisation type and registration number.

**Registry status**:
The registry's own word for an organisation's state, such as "Διαγραμμένη" (struck off), together with the date it took effect. There are 17. The interface shows it in English as the status text.

**Status group**:
One of five kinds of registry status: Registered, At risk (reminder letter or three-month strike-off notice), In liquidation (including examinership), Dissolved, or Unknown (no status, or one the backend does not know). The backend assigns it (`OrganisationStatuses`); `src/organisation/organisation.ts` names and shows it.
_Avoid_: Active, inactive

**Registered address**:
The address the registry records for an organisation. An organisation has at most one.
_Avoid_: Address (on its own)

**Position**:
The role an official holds in an organisation, such as director or secretary.

**Appointment**:
One position held by an official in one organisation. A name's appointments are the organisations in which it holds a position.
_Avoid_: Related company, related organisation

### Search

**Search session**:
One visit's search state together with the lifecycle of the requests it causes. It is made of a query, an entity type, a status filter and a page.
_Avoid_: Search model, search state

**Query**:
The text a user is searching for. A query shorter than three characters is too short to search.
_Avoid_: Search input, search term

**Entity type**:
Which kind of registry record a search session looks for: Organisation or Official.
_Avoid_: Filter, option, selected option

**Status filter**:
A restriction of an organisation search to all organisations or to one status group other than Unknown. It applies to the whole result set, not to one page of it.
_Avoid_: Filter (on its own)

**Page**:
One fixed-size slice of a search session's results, numbered from 1.

### Users

**Auth session**:
Who is using the app right now: checking, signed out, or signed in with a profile. It follows the identity provider's session and keeps no copy of it.
_Avoid_: Auth store, user info, logged-in user

**Profile**:
What the app keeps about a signed-in user: full name, email and phone number.
_Avoid_: User document, account (for the data)

**Library**:
A signed-in user's favourites and groups together.
_Avoid_: Saved companies (for the whole), user data

**Favourite**:
An organisation a user has saved. It is identified by organisation type code and registration number.
_Avoid_: Saved company, bookmark

**Group**:
A named list of organisations a user has made. It is independent of favourites: an organisation can be in any number of groups whether or not it is a favourite.
_Avoid_: Folder, category

### Checkout

**Report**:
A document about one organisation that a buyer pays for. The interface labels it "Full Company Report".
_Avoid_: Company report (outside interface text), product

**Buyer**:
Whoever places an order. A buyer does not have to be signed in.
_Avoid_: Customer, user (for a buyer)

**Cart**:
The reports a buyer has chosen but not yet paid for, kept in the browser. It holds at most one report per organisation and is emptied when an order made from it is paid.
_Avoid_: Basket

**Order**:
One attempt to buy the reports in a cart. It belongs to the signed-in user who placed it, or to no one when the buyer was a guest.

**Order item**:
One report in an order, naming its organisation by organisation type and registration number.

**Order status**:
Where an order stands: Pending (payment not yet confirmed), Paid (the payment provider has confirmed payment), Expired (the buyer never paid and can no longer pay this order) or Fulfilled (the owner has sent the reports to the buyer's email).
_Avoid_: Cancelled, failed, success

**Price**:
What one report costs. Every report costs the same, and the payment provider holds the amount.

**Invoice**:
The payment provider's proof of payment for an order, sent to the buyer. It is not the report.
_Avoid_: Receipt
