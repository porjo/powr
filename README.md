## Powr

Web UI frontend for PowerDNS API interface

### Web Server

PowerDNS does not currently support CORS which means that AngularJS cannot talk directly to it. For this reason, Powr includes a simple web server to a) server static files b) proxy JSON API requests to PowerDNS backend.

### Usage

Grab a [current build](https://github.com/porjo/powr/releases) and untar it somewhere convenient.

Run the web server like so:
```
./powr -d dist/ -pdnsAPIKey=changeme -pdnsHost=myserver -pdnsPort=8081
```

Point your browser to `http://localhost:8080`

### Development

1. Clone this repo somewhere convenient:`git clone https://github.com/porjo/powr.git .`
1. Pull the necessary dependencies using npm and bower e.g. `npm install` + `bower install`
1. Build the html/css/js with `grunt build-dist`. Static content is located under `/dist`
1. Build the `powr` webserver binary with `go build`
