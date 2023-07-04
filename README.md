# Diplomski

Projekt je napravljen koristeći tehnologije Angular i Solidity.
Na početku je potrebno instalirati pakete naredbom `npm install` u root direktoriju projekta.

## 1. Dodavanje lokalne mreže
Kako bi program mogao funkcionirati unutar Metamask ekstenzije potrebno je dodati lokalnu mrežu.

Klikom na metamask ekstenziju pa potom na padajući izbornik koji se nalazi u gornjem dijelu na sredini vidimo mreže.
Na kraju liste nalazi se gumb "Add network". Klikom na gumb otvara se stranica ekstenzije na kojoj je potrebno kliknuti na gumb "Add a network manually".

U polja je potrebno unijeti podatke:\
**Network name**: "Localhost"\
**New RPC URL**: [http://localhost:8545](http://localhost:8545)\
**Chain ID**: "1337"\
**Currency symbol**: "ETH"

Klikom na gumb "Save" spremiti mrežu i odabrati je u padajućem izborniku.

## 2. Modifikacija privatnog i javnog ključa unutar koda
Zbog načina na koji aplikacija funkcionira, potrebno je iz lokalne Ganache aplikacije kopirati dva privatna i dva javna ključa koja će biti korištena samo od strane aplikacije.

Odgovarajuće ključeve je potrebno kopirati iz Ganache aplikacije u datoteku `src/app/trade.service.ts`\
na linijama kôda 34 do 37 u varijable pod nazivom:
```javascript
const PUBLIC_KEY_8 = ""
const PUBLIC_KEY_9 = ""
const PRIVATE_KEY_8 = ""
const PRIVATE_KEY_9 = ""
```
Kao i u datoteku\
`migrations/2_deploy_contracts.js`
na linijama kôda 60 i 61. Također je potrebno promijeniti adresu korisnika koji će koristiti aplikaciju na liniji kôda 74. u varijablama:
```javascript
const account8 = ""
const account9 = ""

const userAccount = ""
```
Na korisnički račun će biti prebačeno 1000 tokena USDC i 50 tokena LINK kako bi korisnik mogao trgovati.


## 3. Pokretanje aplikacije
Za pokretanje aplikacije potrebno je pokrenuti Ganache aplikaciju kao i pokrenuti naredbu `ng serve` u root direktoriju projekta.
Nakon izvršavanja naredbe, aplikacija će biti dostupna na url-u `http://localhost:4200/`

