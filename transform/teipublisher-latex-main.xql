import module namespace m='http://www.tei-c.org/pm/models/teipublisher/latex' at '/db/apps/lgpn-search/transform/teipublisher-latex.xql';

declare variable $xml external;

declare variable $parameters external;

let $options := map {
    "class": "article",
    "section-numbers": false(),
    "font-size": "12pt",
    "styles": ["../transform/teipublisher.css"],
    "collection": "/db/apps/lgpn-search/transform",
    "parameters": if (exists($parameters)) then $parameters else map {}
}
return m:transform($options, $xml)