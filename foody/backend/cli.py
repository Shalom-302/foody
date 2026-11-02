"""Project management commands that run *inside* the api container.

The host ``shaapi`` wrapper invokes these over ``docker compose exec``. For
example ``shaapi auth init`` runs, inside the container::

    python -m backend.cli create-admin --email you@example.com --password ...

Kept on argparse + asyncio (stdlib only) so it has no extra dependency beyond
the backend itself.
"""
from __future__ import annotations

import argparse
import asyncio


async def create_admin(email: str, password: str) -> int:
    """Create an admin user (idempotent) so you can log into Swagger."""
    from backend.app.admin.schema.user import UserRegister
    from backend.common.enums import Role as RoleEnum
    from backend.crud.crud_role import role_dao
    from backend.crud.crud_user import user_dao
    from backend.database.db_postgres import async_db_session
    from backend.models import Role

    async with async_db_session() as db:
        if await user_dao.get_by_email(db, email) is not None:
            print(f"[skip] A user with email {email} already exists.")
            return 0

        # user_dao.add() attaches the admin role *by name*, so make sure it
        # exists first. The Role model has no data_scope column, so we build it
        # directly rather than through CreateRoleParam.
        if await role_dao.get_by_name(db, RoleEnum.ADMIN.value) is None:
            db.add(Role(name=RoleEnum.ADMIN.value))
            await db.flush()

        await user_dao.add(db, UserRegister(email=email, password=password), role_name=RoleEnum.ADMIN.value)
        await db.commit()

    print(f"[ok] Admin user created: {email}")
    print("     Log in at /admin/api/v1/docs with this email and password.")
    return 0


async def promote_admin(phone: str) -> int:
    """Grant the admin role to a WhatsApp customer (they must have logged in once)."""
    from backend.common.enums import Role as RoleEnum
    from backend.core.conf import settings
    from backend.crud.crud_role import role_dao
    from backend.crud.crud_user import user_dao
    from backend.database.db_postgres import async_db_session
    from backend.database.db_redis import redis_client
    from backend.models import Role
    from backend.utils.phone import normalize_phone

    phone = normalize_phone(phone)
    async with async_db_session() as db:
        user = await user_dao.get_by_phone(db, phone)
        if user is None:
            print(f"[error] No account for {phone}: log in once on the shop with WhatsApp first.")
            return 1
        role = await role_dao.get_by_name(db, RoleEnum.ADMIN.value)
        if role is None:
            role = Role(name=RoleEnum.ADMIN.value)
            db.add(role)
            await db.flush()
        if any(r.name == RoleEnum.ADMIN.value for r in user.roles):
            print(f"[skip] {phone} is already an admin.")
            return 0
        user.roles.append(role)
        x_id = user.x_id
        await db.commit()

    # The JWT middleware caches the user (and its roles) in Redis.
    await redis_client.delete(f"{settings.JWT_USER_REDIS_PREFIX}:{x_id}")
    print(f"[ok] {phone} is now an admin.")
    return 0


async def seed_catalog(if_empty: bool = False) -> int:
    """Create the initial FOODY categories and a few demo products (idempotent).

    With ``if_empty`` (run by the container entrypoint at every start) nothing
    happens as soon as one category exists, so edits made in /admin are never
    touched.
    """
    from sqlalchemy import func, select

    from backend.database.db_postgres import async_db_session
    from backend.models.category import Category
    from backend.models.product import Product

    if if_empty:
        async with async_db_session() as db:
            if await db.scalar(select(func.count(Category.id))):
                print("[skip] Catalogue already populated.")
                return 0

    categories = [
        ("Jus de bissap", "jus-de-bissap", "Infusion de fleurs d'hibiscus, servie bien fraîche."),
        ("Jus de citron", "jus-de-citron", "Citronnade maison, pressée chaque matin."),
        ("Autres boissons", "autres-boissons", "Gingembre, baobab et créations de saison."),
        ("Mignardises", "mignardises", "Petits fours, macarons, mini-tartelettes : la douceur en une bouchée."),
        ("Amuse-bouches salés", "amuse-bouches", "Mini-quiches et tartelettes salées pour l'apéritif et les réceptions."),
        ("Mini-cakes", "mini-cakes", "Petites douceurs moelleuses faites main."),
        ("Coffrets gourmands", "coffrets-gourmands", "Assortiments à offrir ou à partager."),
    ]
    products = [
        ("jus-de-bissap", "Bissap classique", 1000, "33 cl", "Fleurs d'hibiscus, sucre de canne, menthe", True),
        ("jus-de-bissap", "Bissap gingembre", 1500, "50 cl", "Fleurs d'hibiscus, gingembre frais, sucre de canne", False),
        ("jus-de-citron", "Citronnade menthe", 1000, "33 cl", "Citrons frais, menthe, sucre de canne", True),
        ("autres-boissons", "Jus de gingembre", 1500, "50 cl", "Gingembre frais, citron, ananas", False),
        ("mini-cakes", "Mini-cakes citron (x6)", 3000, "Boîte de 6", "Farine, beurre, œufs, citron", False),
        ("mini-cakes", "Mini-cakes chocolat (x6)", 3500, "Boîte de 6", "Farine, beurre, œufs, chocolat noir", False),
        ("coffrets-gourmands", "Coffret découverte", 10000, "4 jus + 12 mignardises", "Assortiment de la maison", False),
        ("mignardises", "Plateau de petits fours", 15000, "24 pièces", "Assortiment de mignardises sucrées du moment", True),
        ("mignardises", "Macarons assortis", 7000, "Boîte de 12", "Poudre d'amande, sucre, blancs d'œufs, ganaches parfumées", True),
        ("mignardises", "Mini-tartelettes aux fruits", 6000, "Boîte de 12", "Pâte sablée, crème pâtissière, fruits frais de saison", False),
        ("mignardises", "Mini-tartelettes citron", 6000, "Boîte de 12", "Pâte sablée, crème au citron, zestes", False),
        ("amuse-bouches", "Mini-quiches", 5000, "Boîte de 12", "Pâte brisée, œufs, crème, fromage, garniture du jour", False),
        ("amuse-bouches", "Tartelettes salées garnies", 6000, "Boîte de 12", "Pâte brisée, effiloché de viande, tomates confites, oignons verts", False),
    ]
    from backend.utils.slug import slugify

    # Free Unsplash photos (unsplash.com/license) as placeholders until the
    # brand's own shots are uploaded from /admin/produits. Never overwritten.
    def u(photo: str) -> str:
        return f"https://images.unsplash.com/photo-{photo}?auto=format&fit=crop&w=1200&q=80"

    category_images = {
        "jus-de-bissap": u("1602856124289-0331a6eff6fe"),
        "jus-de-citron": u("1610833805553-43556a0f821d"),
        "autres-boissons": u("1682530016814-6a1c1311cd6e"),
        "mignardises": u("1769812343484-df7391e843d6"),
        "amuse-bouches": u("1786918517877-22456fd79945"),
        "mini-cakes": u("1469533778471-92a68acc3633"),
        "coffrets-gourmands": u("1551500693-f3e9e7842948"),
    }
    product_images = {
        "bissap-classique": (u("1593624191635-f1a49f5eca76"), [u("1563636680-28d36aeb83a4"), u("1788963704657-ed5bf1064976")]),
        "bissap-gingembre": (u("1563636680-28d36aeb83a4"), [u("1788963704657-ed5bf1064976"), u("1682530016814-6a1c1311cd6e")]),
        "citronnade-menthe": (u("1513558003720-343f3a99d97b"), [u("1717439062391-1c2932e1c051"), u("1608322368735-b6b6ec262af7")]),
        "jus-de-gingembre": (u("1682530016814-6a1c1311cd6e"), [u("1610126176343-3e1833a107e1")]),
        "mini-cakes-citron-x6": (u("1561741403-3f7c1f93d0a3"), [u("1469533778471-92a68acc3633")]),
        "mini-cakes-chocolat-x6": (u("1578534083109-58c374019dd8"), []),
        "coffret-decouverte": (u("1551500693-f3e9e7842948"), [u("1494280235352-5dd6a55df7fd")]),
        "plateau-de-petits-fours": (u("1769812343484-df7391e843d6"), [u("1769812343628-81300c21753c"), u("1778341406119-c8d2b3aad980")]),
        "macarons-assortis": (u("1569864358642-9d1684040f43"), [u("1558326567-98ae2405596b"), u("1597895139322-0a1ef77b3c30")]),
        "mini-tartelettes-aux-fruits": (u("1670819916757-e8d5935a6c65"), [u("1646321155195-44f0a4f91d1b")]),
        "mini-tartelettes-citron": (u("1649239702611-ebee87c0e537"), []),
        "mini-quiches": (u("1786918466529-e9f3a123dd43"), []),
        "tartelettes-salees-garnies": (u("1786918517877-22456fd79945"), [u("1786918466524-30d65723a72e")]),
    }

    async with async_db_session.begin() as db:
        by_slug = {c.slug: c for c in (await db.execute(select(Category))).scalars()}
        for order, (name, slug, description) in enumerate(categories):
            if slug not in by_slug:
                by_slug[slug] = Category(name=name, slug=slug, description=description, sort_order=order)
                db.add(by_slug[slug])
        for slug, category in by_slug.items():
            if not category.image_url and slug in category_images:
                category.image_url = category_images[slug]
        await db.flush()
        for product in (await db.execute(select(Product))).scalars():
            if not product.image_url and product.slug in product_images:
                product.image_url, gallery = product_images[product.slug]
                product.gallery = product.gallery or gallery
        existing = set((await db.execute(select(Product.slug))).scalars())
        created = 0
        for cat_slug, name, price, volume, ingredients, featured in products:
            slug = slugify(name)
            if slug in existing:
                continue
            image_url, gallery = product_images.get(slug, (None, []))
            db.add(Product(
                category_id=by_slug[cat_slug].id, name=name, slug=slug, price=price, stock=50,
                volume=volume, ingredients=ingredients, is_featured=featured,
                image_url=image_url, gallery=gallery,
            ))
            created += 1
    print(f"[ok] Catalogue seeded ({created} new product(s)).")
    return 0


def storage_init() -> int:
    """Ensure the configured object-storage bucket exists."""
    # Importing the singleton constructs the client, which creates the bucket
    # if it is missing (see MinioStorage.__init__).
    from backend.common.cloud_storage import mstorage
    from backend.core.conf import settings

    bucket = settings.MINIO_BUCKET_NAME
    if not mstorage.client.bucket_exists(bucket):
        mstorage.create_bucket()
        print(f"[ok] Created bucket: {bucket}")
    else:
        print(f"[skip] Bucket already exists: {bucket}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="backend.cli", description="foody project management commands"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    ca = sub.add_parser("create-admin", help="Create an admin user")
    ca.add_argument("--email", required=True, help="Admin email (login).")
    ca.add_argument("--password", required=True, help="Admin password.")

    sub.add_parser("storage-init", help="Ensure the object-storage bucket exists")

    pa = sub.add_parser("promote-admin", help="Grant the admin role to a WhatsApp customer")
    pa.add_argument("--phone", required=True, help="WhatsApp number, e.g. 0788016204 or +2250788016204.")

    sc = sub.add_parser("seed-catalog", help="Create the initial categories and demo products")
    sc.add_argument("--if-empty", action="store_true", help="Do nothing if any category already exists.")

    args = parser.parse_args()
    if args.command == "create-admin":
        return asyncio.run(create_admin(args.email, args.password))
    if args.command == "storage-init":
        return storage_init()
    if args.command == "promote-admin":
        return asyncio.run(promote_admin(args.phone))
    if args.command == "seed-catalog":
        return asyncio.run(seed_catalog(if_empty=args.if_empty))
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
