/*global MimeParser:true*/
const assert = require("assert");

function eqR( r, key, value ){
    const val = ( typeof value == "string" ) && value.includes('"')? "'"+ value + "'" : JSON.stringify(value);
    return it( `${key} = ${ val }`, () => assert[ typeof value == "object"? "deepEqual" : "equal" ]( r[key], value ) );
}


require("aab-utils/headersparser");
require("aab-utils/node");
require("../headersparser");
describe("MimeParser ( RFC 2047 & 2231 )", () => {
    const
        parser = new MimeParser({
            "content-type": { parse: [ "keyattrs", ";", "mime" ] },
            from: { key: "from" },
            to: { key: "to" },
            cc: { key: "cc" },
            subject: { key: "subject" },
            comments: { key: "comments" },
            keywords: { key: "keywords", parse: [ "list", "," ] },
            date: { key: "date", parse: "date" },
            "resent-date": { key: "date", parse: "date" },
        }),
        r = parser.parse({
            from: "=?US-ASCII?Q?Keith_Moore?= <moore@cs.utk.edu>",
            to: "=?ISO-8859-1?Q?Keld_J=F8rn_Simonsen?= <keld@dkuug.dk>",
            cc: "=?ISO-8859-1?Q?Andr=E9?= Pirard <PIRARD@vm1.ulg.ac.be>",
            subject: `=?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?=
    =?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?=`,
            "content-type": `application/x-stuff; access-type=URL;
    URL*0="ftp://";
    URL*1="cs.utk.edu/pub/moore/bulk-mailer/bulk-mailer.tar";
    title*0*=us-ascii'en'This%20is%20even%20more%20;
    title*1*=%2A%2A%2Afun%2A%2A%2A%20;
    title*2="isn't it!"`
        });
    eqR( r, "mime", "application/x-stuff" );
    eqR( r, "access-type", "URL" );
    eqR( r, "title", "This is even more ***fun*** isn't it!" );
    eqR( r, "URL", "ftp://cs.utk.edu/pub/moore/bulk-mailer/bulk-mailer.tar" );
    eqR( r, "from", `"Keith Moore" <moore@cs.utk.edu>` );
    eqR( r, "to", `"Keld Jørn Simonsen" <keld@dkuug.dk>` );
    eqR( r, "cc", "André Pirard <PIRARD@vm1.ulg.ac.be>" );
    eqR( r, "subject", "If you can read this you understand the example." );
});
