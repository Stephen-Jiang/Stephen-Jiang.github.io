---
title: "DNS Records Explained: A Complete Guide to A, AAAA, CNAME, MX, TXT and More"
date: 2025-07-04
categories: Sysadmin
tags: [DNS, Networking, Web Development]
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

```
example.com.    IN    TXT    "v=spf1 include:_spf.google.com ~all"
```

## Email Security with TXT Records

TXT records implement cryptographic and policy-based email authentication mechanisms through SPF (IP-based authorization), DKIM (digital signatures), and DMARC (policy enforcement with alignment checks).

### SPF (Sender Policy Framework)

**SPF (RFC 7208)** performs IP-based sender validation through DNS TXT records containing authorized mail server specifications. Uses mechanisms (mx, a, include, ip4/ip6) with qualifiers (+pass, -fail, ~softfail, ?neutral) and supports macro expansion for dynamic evaluation.

```
example.com.    IN    TXT    "v=spf1 mx include:_spf.google.com ~all"
```

**Technical Constraints:** 10 DNS lookup limit, forwarding compatibility issues, no automatic subdomain inheritance.

### DKIM (DomainKeys Identified Mail)

**DKIM (RFC 6376)** provides cryptographic message authentication using public-key cryptography. Implements header/body canonicalization (simple/relaxed), RSA-SHA256 or Ed25519 signatures, and selector-based key management for signature verification.

```
selector1._domainkey.example.com.    IN    TXT    "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
```

**Key Features:** Multi-selector support, key rotation capabilities, minimum 1024-bit RSA (2048-bit recommended), body hash validation (bh=), and comprehensive header signing (h=).

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

**DMARC (RFC 7489)** enforces SPF/DKIM authentication through identifier alignment checks and policy-based handling. Implements relaxed/strict alignment modes (aspf/adkim), percentage-based policy application (pct=), and comprehensive reporting (aggregate RUA, forensic RUF).

```
_dmarc.example.com.    IN    TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; sp=reject; adkim=s; pct=100"
```

**Policy Enforcement:** Three-tier policy (none→quarantine→reject), subdomain policy inheritance (sp=), sampling controls, and XML-based aggregate reporting for authentication analytics.

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

## Best Practices for DNS Management

1. **Use appropriate TTL values** - Lower TTLs for records you might change frequently, higher TTLs for stable records
2. **Implement redundancy** - Use multiple A records and MX records for reliability
3. **Monitor your DNS** - Use tools to ensure your DNS records are resolving correctly
4. **Secure your email** - Implement SPF, DKIM, and DMARC to protect against spoofing
5. **Keep records organized** - Use consistent naming conventions and document your DNS setup

## Conclusion

Understanding DNS record types is crucial for anyone managing websites or email systems. Each record type serves a specific purpose, from the basic A records that direct web traffic to the sophisticated TXT records that secure your email communications. By properly configuring these records, you ensure that your domain functions reliably and securely across all internet services.

Whether you're setting up a new website, configuring email security, or troubleshooting connectivity issues, knowing how these DNS records work will help you make informed decisions and maintain a robust online presence.