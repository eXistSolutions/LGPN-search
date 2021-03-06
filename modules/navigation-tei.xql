(:
 :
 :  Copyright (C) 2017 Wolfgang Meier
 :
 :  This program is free software: you can redistribute it and/or modify
 :  it under the terms of the GNU General Public License as published by
 :  the Free Software Foundation, either version 3 of the License, or
 :  (at your option) any later version.
 :
 :  This program is distributed in the hope that it will be useful,
 :  but WITHOUT ANY WARRANTY; without even the implied warranty of
 :  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 :  GNU General Public License for more details.
 :
 :  You should have received a copy of the GNU General Public License
 :  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 :)
xquery version "3.1";

module namespace nav="http://www.tei-c.org/tei-simple/navigation/tei";

declare namespace tei="http://www.tei-c.org/ns/1.0";

import module namespace config="http://www.tei-c.org/tei-simple/config" at "config.xqm";

declare function nav:get-header($config as map(*), $node as element()) {
    $node/tei:teiHeader
};

declare function nav:get-section-for-node($config as map(*), $node as element()) {
    $node/ancestor-or-self::tei:div[count(ancestor::tei:div) < $config?depth][1]
};

declare function nav:get-section($config as map(*), $doc) {
    let $div := ($doc//tei:div)[1]
    return
        if ($div) then
            $div
        else
            let $group := $doc/tei:TEI/tei:text/tei:group/tei:text/(tei:front|tei:body|tei:back)
            return
                if ($group) then
                    $group[1]
                else
                    $doc/tei:TEI//tei:body
};

declare function nav:get-document-title($config as map(*), $root as element()) {
    let $main-title := $root/tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title[@type = 'main']/string()
    return
        if ($main-title) then $main-title else $root/tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title[1]/string()
};


declare function nav:get-content($config as map(*), $div as element()) {
    typeswitch ($div)
        case element(tei:teiHeader) return
            $div
        case element(tei:pb) return (
            let $nextPage := $div/following::tei:pb[1]
            let $chunk :=
                nav:milestone-chunk($div, $nextPage,
                    if ($nextPage) then
                        ($div/ancestor::* intersect $nextPage/ancestor::*)[last()]
                    else
                        ($div/ancestor::tei:div, $div/ancestor::tei:body)[1]
                )
            return
                $chunk
        )
        case element(tei:div) return
            if ($div/tei:div and count($div/ancestor::tei:div) < $config?depth - 1) then
                if ($config?fill > 0 and
                    count(($div/tei:div[1])/preceding-sibling::*//*) < $config?fill) then
                    let $child := $div/tei:div[1]
                    return
                        element { node-name($div) } {
                            $div/@* except $div/@exist:id,
                            attribute exist:id { util:node-id($div) },
                            util:expand(($child/preceding-sibling::*, $child), "add-exist-id=all")
                        }
                else
                    element { node-name($div) } {
                        $div/@* except $div/@exist:id,
                        attribute exist:id { util:node-id($div) },
                        util:expand($div/tei:div[1]/preceding-sibling::*, "add-exist-id=all")
                    }
            else
                $div
        default return
            $div
};

declare function nav:get-subsections($config as map(*), $root as node()) {
    $root//tei:div[tei:head] except $root//tei:div[tei:head]//tei:div
};

declare function nav:get-section-heading($config as map(*), $section as node()) {
    $section/tei:head
};

declare function nav:get-next($config as map(*), $div as element(), $view as xs:string) {
    switch ($view)
        case "page" return
            $div/following::tei:pb[1]
        case "body" return
            ($div/following-sibling::*, $div/../following-sibling::*)[1]
        default return
            nav:get-next($config, $div)
};


declare function nav:get-next($config as map(*), $div as element()) {
    if ($div/tei:div[count(ancestor::tei:div) < $config?depth]) then
        if ($config?fill > 0 and count(($div/tei:div[1])/preceding-sibling::*//*) < $config?fill) then
            nav:get-next($config, $div/tei:div[1])
        else
            $div/tei:div[1]
    else
        $div/following::tei:div[1][count(ancestor::tei:div) < $config?depth]
};

declare function nav:get-previous($config as map(*), $div as element(), $view as xs:string) {
    switch ($view)
        case "page" return
            $div/preceding::tei:pb[1]
        case "body" return
            ($div/preceding-sibling::*, $div/../preceding-sibling::*)[1]
        default return
            nav:get-previous-div($config, $div)
};


declare function nav:get-previous-div($config as map(*), $div as element()) {
    let $parent := $div/ancestor::tei:div[not(*[1] instance of element(tei:div))][1]
    let $prevDiv := $div/preceding::tei:div[count(ancestor::tei:div) < $config?depth][1]
    return
        nav:get-previous-recursive(
            $config,
            if ($parent and (empty($prevDiv) or $div/.. >> $prevDiv)) then $div/.. else $prevDiv
        )
};

declare %private function nav:get-previous-recursive($config as map(*), $div as element()?) {
    if (empty($div)) then
        ()
    else
        if (
            empty($div/preceding-sibling::tei:div)  (: first div in section :)
            and $config?fill > 0
            and count($div/preceding-sibling::*//*) < $config?fill (: less than 5 elements before div :)
            and $div/.. instance of element(tei:div) (: parent is a div :)
        ) then
            nav:get-previous-recursive($config, $div/ancestor::tei:div[count(ancestor::tei:div) < $config?depth][1])
        else
            $div
};

declare %private function nav:milestone-chunk($ms1 as element(), $ms2 as element()?, $node as node()*) as node()*
{
    typeswitch ($node)
        case element() return
            if ($node is $ms1) then
                util:expand($node, "add-exist-id=all")
            else if ( some $n in $node/descendant::* satisfies ($n is $ms1 or $n is $ms2) ) then
                element { node-name($node) } {
                    $node/@*,
                    for $i in ( $node/node() )
                    return nav:milestone-chunk($ms1, $ms2, $i)
                }
            else if ($node >> $ms1 and (empty($ms2) or $node << $ms2)) then
                util:expand($node, "add-exist-id=all")
            else
                ()
        case attribute() return
            $node (: will never match attributes outside non-returned elements :)
        default return
            if ($node >> $ms1 and (empty($ms2) or $node << $ms2)) then $node
            else ()
};
