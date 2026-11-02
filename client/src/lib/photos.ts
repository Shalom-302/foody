// Free Unsplash photos (unsplash.com/license) used by the brand pages until
// FOODY's own shots exist. Product/category photos live in the database and
// are changed from /admin/produits.

export const unsplash = (id: string, w = 900, h?: number) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=75`;

export const PHOTOS = {
    bissapGlass: "1593624191635-f1a49f5eca76",
    bissapCup: "1563636680-28d36aeb83a4",
    bissapWine: "1602856124289-0331a6eff6fe",
    driedHibiscus: "1788963704657-ed5bf1064976",
    hibiscusFlower: "1567990989224-6441e1483ac8",
    hibiscusBush: "1622396727845-c15ef9ffb419",
    hibiscusMacro: "1606440894295-8a79c32fdaf4",
    lemonadeJar: "1513558003720-343f3a99d97b",
    lemonSlices: "1717439062391-1c2932e1c051",
    lemonSlicesFlat: "1610126176343-3e1833a107e1",
    lemonsFabric: "1608322368735-b6b6ec262af7",
    lemonsPile: "1590502593747-42a996133562",
    lemonYellow: "1610833805553-43556a0f821d",
    ginger: "1682530016814-6a1c1311cd6e",
    cupcakesChoco: "1578534083109-58c374019dd8",
    cupcakesBox: "1551500693-f3e9e7842948",
    cupcakesColor: "1561741403-3f7c1f93d0a3",
    blueberryCakes: "1469533778471-92a68acc3633",
    pastriesTray: "1494280235352-5dd6a55df7fd",
    petitFoursStand: "1769812343484-df7391e843d6",
    petitFoursGold: "1769812343628-81300c21753c",
    whiteChocolates: "1778341406119-c8d2b3aad980",
    fruitTartlets: "1670819916757-e8d5935a6c65",
    lemonTartlets: "1649239702611-ebee87c0e537",
    berryTart: "1646321155195-44f0a4f91d1b",
    macaronsRow: "1569864358642-9d1684040f43",
    macaronsStack: "1558326567-98ae2405596b",
    macaronsTrio: "1597895139322-0a1ef77b3c30",
    pastryCase: "1768775134268-6068c6d7c841",
    miniQuiches: "1786918466529-e9f3a123dd43",
    savouryTartlets: "1786918517877-22456fd79945",
} as const;
