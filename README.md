## Powr

Web UI frontend for PowerDNS API interface. 

The project's aims are:
- simplicity: cover the basic operations that most people use
- easy of installation: There are no 3rd party dependencies - everything required is bundled in the release package.

Powr is made up of browser-based Javascript (written in AngularJS) and a proxy/webserver backend (written in Go) which a) serves the static content b) proxies the API requests to/from PowerDNS backend. The `powr` server is available as a pre-compiled binary for Linux amd64 so no compilation is required. 

***Work in progress - Use at your own risk***

### Demo

View a live demo at [http://porjo.github.io/powr](http://porjo.github.io/powr)

The demo runs entirely in your browser, and uses a mock backend.

### Usage

1. Configure your PowerDNS server to enable the API. For the authoratative server, that means adding the following to your `pdns.conf`:
	```
	experimental-json-interface=yes
	webserver=yes
	webserver-address=0.0.0.0
	experimental-api-key=changeme
	```

	Consult the PowerDNS [documentation](http://doc.powerdns.com/md/httpapi/README/) for more information.

1. Grab a [current build](https://github.com/porjo/powr/releases) and unpack somewhere convenient.

1. Run the proxy/webserver like so:
	```
	./powr -d dist/ -pdnsAPIKey=changeme -pdnsHost=myserver -pdnsPort=8081
	```
1. Point your browser to `http://localhost:8080` (or whatever IP/hostname your server has)

*That's it!*

### Development

1. Clone this repo somewhere convenient: `git clone https://github.com/porjo/powr.git .`
1. Pull the necessary dependencies using npm and bower e.g. `npm install` + `bower install`
1. Build the `powr` webserver binary with `go build`
1. Run `grunt-watch` to automatically populate the contents of `/dist` anytime a change is made
1. Edit AngularJS project files under `/src`
