# aab-mime
a@b framework - MIME

Work in progress. Features documented below should not change.

## MimeParser
Extends **HeadersParser** ( **aab-utils**/headersparser ) adding RFC 2047 & 2231 syntaxes.

### NodeJS use
    require("aab-utils/headersparser");
    require("aab-utils/node");
    require("aab-mime/headersparser");

	const parser = new MimeParser({
        from: { key: "from" },
        to: { key: "to" },
        cc: { key: "cc" },
        subject: { key: "subject" },
        comments: { key: "comments" },
        keywords: { key: "keywords", parse: [ "list", "," ] },
        date: { key: "date", parse: "date" },
        ...
    });

### Browser use
    import "aab-utils/headersparser";
    import "aab-mime/headersparser";

	const parser = new MimeParser({
        from: { key: "from" },
        to: { key: "to" },
        cc: { key: "cc" },
        subject: { key: "subject" },
        comments: { key: "comments" },
        keywords: { key: "keywords", parse: [ "list", "," ] },
        date: { key: "date", parse: "date" },
        ...
    });
