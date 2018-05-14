/*global HeadersParser atob TextDecoder:true*/
/*eslint no-control-regex: "off"*/
const
    quote = HeadersParser.quote,

    hex2char = x => String.fromCharCode( parseInt( x, 16 ) ),
    char2dec = x => x.charCodeAt(0),
    RE_SUB = /_/g,
    RE_N = /\x00/g,
    DECODE = {
        B: x => atob( x ),
        Q: ( x, r ) => x.replace(RE_SUB, " ").replace( r, m => hex2char( m.substr(1) ) )
    },
    decode = ( rs, charset, encoding, value ) => {
        value = DECODE[ encoding.toUpperCase() ]( value, rs );
        const decoder = getDecoder( charset );
        if( !decoder ) return value;
        return decoder.decode( new Uint16Array( value.split("").map( char2dec ) ) ).replace( RE_N, "" );
    },

    DECODERS = Object.create(null),
    FAILS = new Set();

function getDecoder( charset, raise ){
    charset = ( charset || "" ).toLowerCase();
    if( !charset && ( charset == "utf-8" ) ) return;
    if( charset in DECODERS ) return DECODERS[ charset ];
    else if( !FAILS.has( charset ) )
        try{
            let decoder = new TextDecoder( charset );
            const dcharset = decoder.encoding;
            if( !( dcharset in DECODERS ) ) DECODERS[ dcharset ] = decoder;
            return DECODERS[ charset ] = DECODERS[ dcharset ];
        }
        catch(e){
            FAILS.add( charset );
            if( raise ) throw Object.assign( new Error(`Unsupported charset "${ charset }"`), { code: "ECHARSET" } );
        }
}


const rfc2047 = {
    REs: /=[a-f\d]{2}/gi,
    RE_SPLIT: /^=\?([\x21\x23-\x27\x2b\x2d0-9A-Z\x5c\x5e-\x7e]+)(?:\*([A-Z]{1,8}(?:-[A-Z]{1,8})*))?\?([BQbq])\?([^ ?]*)\?=/,
    split( idx, txt, parts ){
        if( txt.substr( idx, 2 ) !== "=?" ) return;
        try{
            const
                [ x, charset, _lang, encoding, encoded ] = txt.substr( idx ).match( rfc2047.RE_SPLIT ),
                value = decode( rfc2047.REs, charset, encoding, encoded );
            let last = parts.slice(-1)[0],
                issp = last == " ";
            if( issp ) last = parts.slice(-2)[0];
            if( typeof last == "object" ){
                last.value += value;
                if( issp ) parts.pop();
            }else parts.push( { value } );
            return idx + x.length;
        }catch(e){ /* not an rfc2047 syntax */ }
    }
};


const rfc2231 = {
    RE_LEFT: /^([^*]+)\*(?:(\d+)?\*?)?$/,
    REs: /%[a-f\d]{2}/gi,
    RE_SPLIT: /^(?:([A-Z\d\-_:().]*)'([A-Z]{1,8}(?:-[A-Z]{1,8})*)?')?([\x21\x23-\x27\x2a\x2b\x2d\x2e0-9\x5e-z\x7c\x7e]*)/i,
    split( idx, txt, parts ){
        const [ left, eq ] = parts.slice(-4).filter( x => x !== " " ).slice(-2);
        let l;
        if( ( eq !== "=" ) || !( l = left.match( rfc2231.RE_LEFT ) ) ) return;
        const store = parts.rfc2231 || ( parts.rfc2231 = {} );
        let index, value, charset,
            [ _l, name, nb ] = l,
            data = store[ name ];

        if( left.endsWith("*") ){
            const r = txt.substr( idx ).match( rfc2231.RE_SPLIT );
            if( !r ) return;
            let [ x, chr, _lang, encoded ] = r;
            charset = chr || ( data && data.charset );
            if( !charset ) return;
            value = decode( rfc2231.REs, charset, "Q", encoded );
            index = idx + x.length;
        }else{
            const found = this.nextString( idx, txt );
            if( !found ) return;
            value = found.text;
            index = found.index;
        }

        let li = parts.lastIndexOf( left );
        if( data ){
            let c = parts[ li -1 ];
            while( " ,;".includes( c ) )
                c = parts[ --li -1 ];
            parts.splice( li, parts.length - li );
        }else{
            parts[ li ] = name;
            data = store[ name ] = { index: parts.length, parts: [] };
        }
        if( charset ) data.charset = charset;
        data.parts[ nb? Number(nb) : 0 ] = value;
        parts[ data.index ] = data.parts.join("");
        return index;
    }
};


class MimeParser extends HeadersParser {

    split( keep, txt ){
        return super
            .split( keep, txt )
            .map( x => typeof x == "object"? ( keep && x.value.includes(" ")? quote( x.value ) : x.value ) : x );
    }
}
MimeParser.SPLITS = [
    rfc2047.split,
    rfc2231.split
].concat( HeadersParser.SPLITS );

global.MimeParser = MimeParser;
