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

**Active**:
Describes an organisation whose registry status is "Εγγεγραμμένη" (registered). The rule lives in `src/organisation/organisation.ts` only.

**Inactive**:
Describes an organisation with any registry status other than "Εγγεγραμμένη".

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
A restriction of an organisation search to all, active or inactive organisations. It applies to the whole result set, not to one page of it.
_Avoid_: Filter (on its own)

**Page**:
One fixed-size slice of a search session's results, numbered from 1.
