---
title: "DNS Records Explained: A Complete Guide to A, AAAA, CNAME, MX, TXT and More"
date: 2025-07-04
last_modified_at: 2026-01-04
categories: Sysadmin
tags: [DNS, Networking, Web Development, Cybersecurity]
---

The Domain Name System (DNS) is the phonebook of the internet, translating human-readable domain names into IP addresses that computers can understand. At the heart of DNS are various record types, each serving a specific purpose in directing traffic and providing information about your domain. Let's explore the most common DNS record types and what they do.

## A Records - The Foundation

**A records** (Address records) are the most fundamental DNS records. They map a domain name directly to an IPv4 address.

```
example.com.    IN    A    192.168.1.1
www.example.com.    IN    A    192.168.1.1
```

When someone types your domain into their browser, the A record tells their computer exactly which server to connect to. Most websites have multiple A records pointing to different servers for redundancy and load balancing.

## AAAA Records - IPv6 Addresses

**AAAA records** (quad-A records) serve the same purpose as A records but for IPv6 addresses. As the internet transitions to IPv6, these records become increasingly important.

```
example.com.    IN    AAAA    2001:db8::1
```

The name "AAAA" comes from the fact that IPv6 addresses are four times longer than IPv4 addresses (128 bits vs 32 bits).

## CNAME Records - Aliases and Redirects

**CNAME records** (Canonical Name records) create aliases for domain names. Instead of pointing to an IP address, they point to another domain name.

```
www.example.com.    IN    CNAME    example.com.
blog.example.com.    IN    CNAME    example.com.
```

CNAMEs are useful for:
- Creating subdomains that point to your main domain
- Redirecting traffic from multiple domains to a single destination
- Simplifying DNS management when you need to change IP addresses

### Understanding Apex vs Subdomains

**Apex domain** (also called root domain or naked domain) is your domain without any prefix:
- `example.com` is the apex domain
- `www.example.com` is a subdomain
- `blog.example.com` is a subdomain

**Subdomains** are prefixes added to your apex domain that can point to different services or content areas.

### CNAME Limitations and CNAME Flattening

**Traditional CNAME Limitation:** A CNAME record cannot coexist with other record types for the same name, and you cannot create a CNAME for the root domain (apex domain). This is because the apex domain needs other records like MX, NS, and SOA records.

**CNAME Flattening:** Modern DNS providers offer CNAME flattening for apex domains, solving this RFC limitation. Here's how it works:

1. **DNS Query Resolution** - When you create a CNAME at the apex domain through your DNS provider
2. **Recursive Resolution** - The authoritative nameservers perform recursive DNS lookups to resolve the CNAME chain
3. **A Record Synthesis** - The final IP addresses are returned as synthesized A records to the client
4. **TTL Inheritance** - The response TTL matches the lowest TTL in the CNAME chain

```
# What you configure with your DNS provider:
example.com.    IN    CNAME    target.example.org.

# What clients receive (synthesized response):
example.com.    IN    A    192.168.1.1
example.com.    IN    A    192.168.1.2
```

This process is transparent to end users - they receive standard A records while you benefit from the flexibility of CNAME aliases. The synthesized A records are dynamically updated when the target domain's IP addresses change, maintaining the canonical relationship without breaking DNS standards.

## MX Records - Mail Routing

**MX records** (Mail Exchange records) specify which mail servers are responsible for handling email for your domain.

```
example.com.    IN    MX    10    mail.example.com.
example.com.    IN    MX    20    backup-mail.example.com.
```

The number (10, 20) represents priority - lower numbers have higher priority. If the primary mail server is unavailable, email will be delivered to the backup server.

## TXT Records - Versatile Information Storage

**TXT records** store arbitrary text data associated with your domain. While originally intended for human-readable information, they've become crucial for various services and security measures.

## Email Security with TXT Records

TXT records implement cryptographic and policy-based email authentication mechanisms through SPF (IP-based authorization), DKIM (digital signatures), and DMARC (policy enforcement with alignment checks).

### SPF (Sender Policy Framework)

**SPF (RFC 7208)** performs IP-based sender validation through DNS TXT records containing authorized mail server specifications. Uses mechanisms (mx, a, include, ip4/ip6) with qualifiers (+pass, -fail, ~softfail, ?neutral) and supports macro expansion for dynamic evaluation.

```
example.com.    IN    TXT    "v=spf1 include:_spf.google.com mx ~all"
```

**Technical Constraints:** 10 DNS lookup limit, forwarding compatibility issues, no automatic subdomain inheritance.

**How SPF Prevents Spoofing:**

SPF stops attackers from using unauthorized mail servers to send emails claiming to be from your domain. When a receiving mail server gets an email claiming to be from `user@example.com`, it:

1. **Queries your SPF record** - Looks up `example.com`'s TXT record for SPF policy
2. **Compares sending IP** - Checks if the connecting mail server's IP is authorized
3. **Applies policy decision** - Accepts, soft-fails, or rejects based on your SPF qualifier

**Attack Scenario Blocked:** An attacker using their own mail server (IP: 203.0.113.50) tries to send email as `ceo@yourcompany.com`. The recipient's mail server queries your SPF record, sees this IP isn't authorized, and marks or rejects the message. Without SPF, this spoofed email would be delivered without question.

**Understanding SPF Policy Qualifiers:**

The "all" mechanism at the end of your SPF record determines what happens to unauthorized senders:

- **`-all`** (Fail) - **Most secure**. Tells receiving servers to REJECT emails from unauthorized IPs. Use this when you control all your mail servers and want maximum protection against spoofing.
  ```
  v=spf1 include:_spf.google.com mx -all
  ```

- **`~all`** (SoftFail) - **Recommended for most**. Marks suspicious emails but still delivers them, usually to spam. Safer during initial deployment to avoid blocking legitimate email if your SPF record is incomplete.
  ```
  v=spf1 include:_spf.google.com mx ~all
  ```

- **`?all`** (Neutral) - No policy enforcement. Provides no spoofing protection.
- **`+all`** (Pass) - Accepts all senders. **Never use this**—it defeats the entire purpose of SPF.

**Best Practice:** Start with `~all` during testing, monitor for false positives, then upgrade to `-all` once you've verified all legitimate mail sources are authorized.

### DKIM (DomainKeys Identified Mail)

**DKIM (RFC 6376)** provides cryptographic message authentication using public-key cryptography. Implements header/body canonicalization (simple/relaxed), RSA-SHA256 or Ed25519 signatures, and selector-based key management for signature verification.

```
selector1._domainkey.example.com.    IN    TXT    "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
```

**Key Features:** Multi-selector support, key rotation capabilities, minimum 1024-bit RSA (2048-bit recommended), body hash validation (bh=), and comprehensive header signing (h=).

**How DKIM Prevents Spoofing and Tampering:**

DKIM provides cryptographic proof that an email actually came from your domain and wasn't modified in transit. Unlike SPF which only validates the sending server, DKIM validates the message itself through digital signatures:

1. **Signing (Sender's Mail Server):**
   - Your mail server creates a hash of specific email headers and the message body
   - Signs this hash with your private key (kept secret on your mail server)
   - Adds the signature as a `DKIM-Signature` header to the outgoing email

2. **Verification (Recipient's Mail Server):**
   - Extracts the selector and domain from the DKIM-Signature header
   - Queries DNS for your public key at `selector._domainkey.yourdomain.com`
   - Re-computes the hash of the received email's headers and body
   - Uses your public key to verify the signature matches
   - If valid, the email is proven authentic and unmodified

**Attack Scenarios Blocked:**

- **Man-in-the-Middle Tampering:** An attacker intercepts a legitimate email and modifies the body to include a malicious link. The DKIM signature verification fails because the body hash no longer matches, alerting the recipient that the message was tampered with.

- **Replay Attacks:** An attacker captures a legitimate signed email and tries to resend it with modified headers (changing the "To:" field). The signature verification fails because the signed headers were altered.

- **SPF Bypass via Forwarding:** Email forwarding breaks SPF (the forwarding server's IP isn't in your SPF record), but DKIM signatures survive forwarding intact, maintaining authentication.

**Why This Matters:** Even if an attacker gains access to an authorized mail server (passing SPF), they cannot forge DKIM signatures without the private key. This prevents insider threats and compromised-server scenarios from being used for spoofing.

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

**DMARC (RFC 7489)** enforces SPF/DKIM authentication through identifier alignment checks and policy-based handling. Implements relaxed/strict alignment modes (aspf/adkim), percentage-based policy application (pct=), and comprehensive reporting (aggregate RUA, forensic RUF).

```
_dmarc.example.com.  IN  TXT  "v=DMARC1; p=reject; sp=reject; aspf=s; adkim=s; rua=mailto:dmarc@example.com; ruf=mailto:dmarc-forensic@example.com; fo=1; pct=100"
```

**Parameter Breakdown:**
- `v=DMARC1` - Protocol version identifier
- `p=reject` - Main domain policy: reject failed authentication attempts
- `sp=reject` - Subdomain policy: also reject for all subdomains
- `aspf=s` - SPF alignment mode strict (exact domain match required for maximum security)
  - *Note: Use `aspf=r` (relaxed) if your organization relies on email forwarding, as forwarded emails will fail strict SPF alignment*
- `adkim=s` - DKIM alignment mode strict (exact domain match required)
- `rua=mailto:dmarc@example.com` - Aggregate reports: daily statistical summaries (low volume, typically one email per day per sender)
- `ruf=mailto:dmarc-forensic@example.com` - Forensic reports: real-time failure reports with message samples (high volume, one report per failed message)
  - *Warning: Contains message content and headers. Consider privacy/GDPR implications. Many providers don't send these.*
- `fo=1` - Forensic options: generate reports if either SPF or DKIM fails (default fo=0 only reports when both fail)
- `pct=100` - Apply policy to 100% of messages

**Policy Enforcement:** Three-tier policy (none→quarantine→reject), subdomain policy inheritance (sp=), sampling controls, and XML-based aggregate reporting for authentication analytics.

**How DMARC Prevents Spoofing Through Policy Enforcement:**

DMARC is the enforcement layer that tells receiving mail servers what to do when SPF or DKIM authentication fails. While SPF and DKIM provide authentication mechanisms, DMARC provides the policy and reporting that makes them actionable:

1. **Alignment Requirement:**
   - DMARC requires that the "From:" header domain (what users see) aligns with either:
     - The domain validated by SPF (Return-Path/envelope sender), OR
     - The domain validated by DKIM signature
   - This prevents "display name" spoofing where attackers pass SPF/DKIM for their own domain but spoof your domain in the visible "From:" field

2. **Policy Actions:**
   - **`p=none`** - Monitor mode. Authentication failures are reported but emails are delivered. Use this to test your configuration.
   - **`p=quarantine`** - Failed emails go to spam/junk folders. Recommended for most organizations.
   - **`p=reject`** - Failed emails are completely rejected at SMTP level. Maximum protection, but requires perfect SPF/DKIM setup.

3. **Aggregate Reporting (rua):**
   - Receiving mail servers send you daily XML reports showing:
     - Who is sending email claiming to be from your domain
     - Which messages pass/fail SPF and DKIM
     - How recipient servers handled the messages
   - This visibility helps detect spoofing attempts and misconfigurations

**Attack Scenarios Blocked:**

- **Display Name Spoofing:** An attacker sends email from `attacker.com` with SPF/DKIM passing for their domain, but sets the "From:" header to `ceo@yourcompany.com`. DMARC alignment fails because the authenticated domain (attacker.com) doesn't match the From header (yourcompany.com), and the email is quarantined or rejected.

- **Subdomain Exploitation:** Attackers find an unconfigured subdomain like `newsletter.yourcompany.com` without SPF/DKIM and send spoofed emails from it. DMARC's subdomain policy (`sp=reject`) blocks this attack vector.

- **Inconsistent Authentication:** An email passes SPF but fails DKIM (or vice versa). Without DMARC, some recipients might accept it. With DMARC, you can require both to pass or enforce consistent handling across all receiving servers.

**Why DMARC Completes the Defense:**

SPF and DKIM alone don't tell receiving servers what to do with failures—some might deliver suspicious emails anyway. DMARC provides:

- **Explicit policy** - Clear instructions on handling authentication failures
- **Visibility** - Reports showing all authentication attempts (legitimate and malicious)
- **Consistent enforcement** - Major email providers (Gmail, Microsoft, Yahoo) honor DMARC policies
- **Subdomain protection** - Prevents attackers from exploiting forgotten subdomains

**Real-World Impact:** Organizations implementing DMARC at `p=reject` see dramatic reductions in phishing emails using their domain. The FBI's Internet Crime Complaint Center reports that DMARC is one of the most effective controls against Business Email Compromise attacks.

## Other Important DNS Records

### NS Records (Name Server)
Specify which name servers are authoritative for your domain:

```
example.com.    IN    NS    ns1.example.com.
example.com.    IN    NS    ns2.example.com.
```

### PTR Records (Reverse DNS)
Used for reverse DNS lookups, mapping IP addresses back to domain names:

```
1.1.168.192.in-addr.arpa.    IN    PTR    example.com.
```

### SRV Records (Service)
Specify the location of specific services:

```
_sip._tcp.example.com.    IN    SRV    10    5    5060    sipserver.example.com.
```

## DNSSEC - Authenticating DNS Itself

While SPF, DKIM, and DMARC protect email, **DNSSEC (Domain Name System Security Extensions)** protects DNS infrastructure itself by adding cryptographic signatures to DNS records.

### The Problem

Traditional DNS has no authentication. When your computer asks "What's the IP for bank.com?", it trusts whatever response arrives first. This enables **DNS cache poisoning**—attackers inject fraudulent records into resolver caches, redirecting users to malicious servers while the browser shows the legitimate domain name.

### How DNSSEC Works

DNSSEC creates a **chain of trust** using public-key cryptography:

1. Domain owners sign their DNS records with private keys
2. Public keys are published as DNSKEY records
3. Key hashes (DS records) are published in parent zones
4. Resolvers validate signatures from root zone down to domain

```
Root Zone (.) → Signs .com DS record
    ↓
.com TLD → Signs example.com DS record
    ↓
example.com → Signs A, MX, TXT records
    ↓
Resolver validates entire chain
```

### Key DNSSEC Records

- **DNSKEY** - Public keys for signature verification
- **DS** - Key hash published in parent zone (chain of trust)
- **RRSIG** - Cryptographic signature for each record set
- **NSEC/NSEC3** - Authenticated proof that a record doesn't exist

### Attack Scenarios Blocked

**DNS Cache Poisoning:** An attacker floods a resolver with forged responses for `yourbank.com`, racing against the legitimate nameserver. If a forged response is accepted first, all users of that resolver are redirected to a phishing site displaying the real domain name. **With DNSSEC:** Forged responses lack valid cryptographic signatures. The resolver validates the signature chain and rejects unsigned responses, making cache poisoning computationally infeasible.

**BGP Hijacking + DNS Interception:** An attacker announces fraudulent BGP routes to intercept DNS traffic destined for authoritative nameservers. All intercepted queries return attacker-controlled IP addresses. **With DNSSEC:** Even when attackers intercept and respond to DNS queries, they cannot forge valid signatures without the domain's private keys. Resolvers reject the unsigned responses.

**Compromised Resolver:** A user connects to malicious public WiFi or a compromised ISP where the DNS resolver is controlled by an attacker. All DNS queries return attacker-specified IPs. **With DNSSEC:** End-to-end cryptographic validation means even a compromised resolver cannot forge responses. DNSSEC-validating resolvers reject records that fail signature verification.

### Why DNSSEC Matters

DNSSEC protects all DNS-dependent security mechanisms by preventing:

- **Email authentication bypass** - Attackers cannot serve fraudulent SPF/DKIM/DMARC records
- **Traffic redirection** - HTTPS and API traffic cannot be silently redirected to malicious servers
- **Certificate hijacking** - Attackers cannot respond to DNS-01 ACME challenges to obtain fraudulent certificates

DNSSEC ensures the integrity of DNS responses that other security systems depend on.

## Best Practices for DNS Management

1. **Use appropriate TTL values** - Lower TTLs for records you might change frequently, higher TTLs for stable records
2. **Implement redundancy** - Use multiple A records and MX records for reliability
3. **Monitor your DNS** - Use tools to ensure your DNS records are resolving correctly
4. **Secure your email with layered authentication** - Implement all three email security mechanisms together for maximum protection:
   - **Start with SPF** - Publish an SPF record authorizing your mail servers, begin with `~all` and progress to `-all`
   - **Add DKIM** - Configure your mail server to sign outgoing messages with DKIM
   - **Enforce with DMARC** - Start with `p=none` to collect reports, then move to `p=quarantine` or `p=reject`
   - **Monitor reports** - Regularly review DMARC aggregate reports to identify spoofing attempts and legitimate sources you may have missed
   - **Protect subdomains** - Apply SPF/DKIM/DMARC to all sending subdomains, or use DMARC's `sp=reject` to block unauthorized subdomains
5. **Keep records organized** - Use consistent naming conventions and document your DNS setup

## Conclusion

Understanding DNS record types is crucial for anyone managing websites or email systems. Each record type serves a specific purpose, from the basic A records that direct web traffic to the sophisticated TXT records that secure your email communications. By properly configuring these records, you ensure that your domain functions reliably and securely across all internet services.

Whether you're setting up a new website, configuring email security, or troubleshooting connectivity issues, knowing how these DNS records work will help you make informed decisions and maintain a robust online presence.