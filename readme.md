Overte is a metaverse engine and platform based on the principles of open-source and decentralization.

Download
========
You can download Overte from our [website](https://overte.org). 

If you prefer to build from source, you can find the codebase for Overte in the [project-athena](https://github.com/overte-org/overte) repository.

overte-content
========
In this repository you'll find our content projects built for worlds that run on the Overte platform. We welcome community contributions if you have created content that you would like to share with the developer community. You can find specific information about where specific content is used in the subdirectory readme files.

***All content in this repo is available under free and open licenses. The majority of it will be Apache 2.0, CC0, and CC-BY. Licensing is defined within the package.json files for items.***

Our file structure is designed to store projects related to how they are deployed within Overte, but recognize that not all content will fit neatly into a specific category. 

* DomainContent: Content that lives within a specific domain in Overte, generally one that is open to the public. This repo is not meant for private hosting, but if you build something that we think would be a solid addition to a domain that we host, this is where it can go!

* Marketplace: Content that is self-contained and was intended to be published on the HiFi Marketplace. 

* Shared: A directory for utilities or other pieces of content that is meant to be easily ported across different domains and content pieces

* Prototyping: For projects that are more experimental in nature

* Utilities: Projects or code that is meant to extend the Interface functionality or provide other utility function for working in Overte

If you find a bug and have a fix, pull requests are welcome.

Moving Hosted Content
========
Currently, all content in this repository is hosted at **https://content.overte.org/**. If you intend to rehost some or all of this content, then you will need to do a mass search and replace across the content you are rehosting to change from the Overte URL base to yours. e.g. **https://content.overte.org/** becomes **https://cdn.yourwebsite.com/**
Example command for Linux:
```bash
grep -RiIl 'content.overte.org' | xargs sed -i 's/content.overte.org/cdn.yourwebsite.com/g'
```
