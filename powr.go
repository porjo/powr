// The MIT License (MIT)
//
// Copyright (c) 2014 Ian Bishop
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

//
// powr.go is a simply HTTP web server to:
//   a) server static files
//   b) proxy JSON API requests to PowerDNS backend.
//
package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/codegangsta/negroni"
	"github.com/gorilla/context"
	"github.com/phyber/negroni-gzip/gzip"
)

// ResponseWriter wrapper to catch 404s
type html5mode struct {
	w http.ResponseWriter
	r *http.Request
}

type pdnsBackend struct {
	httputil.ReverseProxy
	Host string
	Port int
	Key  string
}

var h5m html5mode
var webRoot string
var pdns pdnsBackend

func redir(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	if r.TLS == nil {
		http.Redirect(w, r, "https://"+r.Host+r.RequestURI, http.StatusMovedPermanently)
	} else {
		next(w, r)
	}
}

func main() {
	var err error
	var port, portTLS int
	var logFile, errLogFile string
	var logger *negroni.Logger
	var errLogger *log.Logger

	html5mode := flag.Bool("html5mode", false, "on HTTP 404, serve index.html. Used with AngularJS html5mode.")
	flag.StringVar(&webRoot, "d", "public", "root directory of website")
	flag.StringVar(&logFile, "l", "", "log requests to a file. Defaults to stdout")
	flag.StringVar(&errLogFile, "e", "", "log errors to a file. Defaults to stdout")
	certfile := flag.String("certFile", "", "SSL certificate filename")
	keyfile := flag.String("keyFile", "", "SSL key filename")
	flag.IntVar(&port, "p", 8080, "HTTP port")
	flag.IntVar(&portTLS, "s", 8081, "HTTPS port")
	forceTLS := flag.Bool("forceTLS", false, "Force HTTPS")
	stripPrefix := flag.String("stripPrefix", "", "path to strip from incoming requests")
	useGzip := flag.Bool("gzip", false, "enable gzip compression")
	flag.StringVar(&pdns.Host, "pdnsHost", "localhost", "PowerDNS API hostname or IP")
	flag.IntVar(&pdns.Port, "pdnsPort", 8081, "PowerDNS API HTTP port")
	flag.StringVar(&pdns.Key, "pdnsAPIKey", "", "PowerDNS API key")
	flag.Parse()

	pdns.Setup()

	_, err = os.Lstat(webRoot)
	if err != nil {
		log.Fatalf("error opening webroot: %s\n", err)
	} else {
		log.Printf("using webroot '%s'\n", webRoot)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/servers", pdns.ServeHTTP)
	mux.HandleFunc("/servers/", pdns.ServeHTTP)

	if *stripPrefix != "" {
		log.Printf("stripPrefix '%s'\n", *stripPrefix)
		// Handle either case of trailing slash
		stripPrefixTrim := strings.TrimRight(*stripPrefix, "/")
		mux.Handle(stripPrefixTrim+"/", http.StripPrefix(stripPrefixTrim+"/", http.FileServer(http.Dir(webRoot))))
	} else {
		mux.Handle("/", http.FileServer(http.Dir(webRoot)))

	}

	if logFile != "" {
		f, err := os.OpenFile(logFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening logfile '%s', %s\n", logFile, err)
		}
		log.Printf("writing to logfile '%s'\n", logFile)
		logger = &negroni.Logger{log.New(f, "", log.LstdFlags)}
	} else {
		logger = negroni.NewLogger()
	}

	if errLogFile != "" {
		f, err := os.OpenFile(errLogFile, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
		if err != nil {
			log.Fatalf("error opening logfile '%s', %s\n", errLogFile, err)
		}
		log.Printf("writing errors to logfile '%s'\n", errLogFile)
		errLogger = log.New(f, "", log.LstdFlags)
	}

	n := negroni.New(
		negroni.NewRecovery(),
		logger,
	)
	if logFile != "" {

	}

	if *forceTLS && *certfile != "" && *keyfile != "" {
		log.Printf("Force TLS enabled\n")
		n.Use(negroni.HandlerFunc(redir))
	}

	if *useGzip {
		n.Use(gzip.Gzip(gzip.DefaultCompression))
	}

	if *html5mode {
		log.Printf("HTML5 mode enabled\n")
		n.Use(negroni.HandlerFunc(html5ModeMiddleware))
	}

	n.UseHandler(mux)

	if *certfile != "" && *keyfile != "" {
		go func() {
			log.Printf("HTTPS listening on port %d\n", portTLS)
			config := &tls.Config{}
			// only support TLS (mitigate against POODLE attack)
			config.MinVersion = tls.VersionTLS10
			//Use only modern ciphers
			config.CipherSuites = []uint16{tls.TLS_RSA_WITH_AES_128_CBC_SHA,
				tls.TLS_RSA_WITH_AES_256_CBC_SHA,
				tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
				tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
				tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
				tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
				tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
				tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256}
			server := &http.Server{Addr: ":" + strconv.Itoa(portTLS), Handler: n, TLSConfig: config}
			if errLogger != nil {
				server.ErrorLog = errLogger
			}
			log.Fatal(server.ListenAndServeTLS(*certfile, *keyfile))
		}()
	}

	log.Printf("HTTP listening on port %d\n", port)
	server := &http.Server{Addr: ":" + strconv.Itoa(port), Handler: n}
	if errLogger != nil {
		server.ErrorLog = errLogger
	}
	log.Fatal(server.ListenAndServe())
}

// This should come before any static file-serving middleware
func html5ModeMiddleware(rw http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	h5m.w = rw
	h5m.r = r
	next(&h5m, r)
	//context.Clear(r)
}

func (sr *html5mode) Header() http.Header { return sr.w.Header() }
func (sr *html5mode) Write(d []byte) (int, error) {
	if _, ok := context.GetOk(sr.r, "html5modeWritten"); ok {
		return 0, nil
	} else {
		return sr.w.Write(d)
	}
}

func (sr *html5mode) WriteHeader(status int) {
	if status == 404 {
		if path.Ext(sr.r.URL.Path) == "" {
			// Server contents of index.html if request isn't for a file
			// Required for Angular.js html5mode
			sr.w.Header().Del("Content-Type")
			http.ServeFile(sr.w, sr.r, webRoot+"/index.html")
			context.Set(sr.r, "html5modeWritten", true)
			return
		}
	}
	sr.w.WriteHeader(status)
}

func (p *pdnsBackend) Setup() {
	p.Director = func(req *http.Request) {
		req.Header.Set("X-API-Key", p.Key)
		req.Host = p.Host
		req.URL.Scheme = "http"
		req.URL.Host = fmt.Sprintf("%s:%d", p.Host, p.Port)
	}
}
