// The shop name, in one place: change it here (and BRAND_NAME on the API for
// the WhatsApp messages) to rename the brand everywhere.
export const BRAND = {
    name: "FOODY",
    tagline: "Miniardise",
    get full() {
        return `${this.name} ${this.tagline}`;
    },
};
