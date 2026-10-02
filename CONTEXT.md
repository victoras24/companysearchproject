# KYCy

The web app for searching the Cyprus company registry: finding organisations and their officials, viewing their details, saving and tracking them.

## Language

### Registry

**Organisation**:
An entity recorded in the Cyprus company registry, of any organisation type. The interface labels it "Company".
_Avoid_: Company (outside interface text)

**Official**:
A person or organisation holding a position in an organisation.

**Active**:
Describes an organisation whose registry status is "Εγγεγραμμένη" (registered).

**Inactive**:
Describes an organisation with any registry status other than "Εγγεγραμμένη".

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
