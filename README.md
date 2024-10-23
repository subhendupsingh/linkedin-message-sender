## What will this script do?

1. It will scan all your connections and internally divide them into 2 groups: new & old
2. It will request new connections to subscribe to the notifications on Product Hunt teaser page, since these people are already on ProductHunt
3. It will send a slighlty different message to old connections, asking them to create an account on PH.
4. It will log all the contacted connections in a JSON file.
5. On subsequent runs, it will only contact people who have not been already contact, so that we don't send duplicate messages.

## Configuration

Open `index.js` and save your linkedin credentials : username/email and password. These credentials will not leave your system, so safe to save.

## How to run the script

Run `install.bat` if you are on a windows machine or `./install.sh` if you are on mac. You can double click on these files to run. This will install dependecies and run the script.

## Running manually

### Install dependencies

```bash
npm install
```

### Run
```typescript
node index.js
```
