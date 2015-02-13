# Fuzzed Up
============

####Installation
- Install dependencies with ```npm install```
- Run the web server with ```node app.js```

####Documentation
- Routes are mapped in ```routes.js``` and they relate to a controller in ```controllers/fuzz.js```
  - The routes:
    - ```GET /decode``` Fetches a scrambled message from the default quiz url
    - ```POST /scramble``` Will fuzz up a message with default options or options submitted through the request body. The sample below is populated from stats this app has collected from the quiz url.
      
      ```javascript
      {
        "minSpacing": 2,
        "maxSpacing": 137,
        "superSecretChars":["0","1","2","3","4","5","6","7","8","9","l","B","q","e","G","S","C","H","^","L","k","V","%","s","g","K","?",")","A","X","!",":","y","u","x","Q","@","c","m","$","M","{","W","n","Z","i","R","T","#","h","d","I","Y","r","f","b","&","z","w","O","D","*","t","E","a","}","o","F","(","N","P","p","U","v","j","J"],    
        "width": 103.59148947889219
      }
      ```
      
    - ```GET /secret```Will return a scrambled messaged with the default options. Can chain with the decode route to test the decoder: ```http://localhost:8080/decode?url=http://localhost:8080/secret```
    - ```GET /pattern```Fetches the scrambled message from the default url and determines the exact pattern it's using. Also updates two JSON files that keep continuous statistics on all previous requests which will become more accurate over time.
    - ```GET /data```Returns some simple stats on all previous requests
- Utility functions are located in ```controllers/utility.js```
