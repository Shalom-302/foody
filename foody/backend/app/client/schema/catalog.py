from datetime import datetime

from pydantic import ConfigDict, Field, computed_field

from backend.common.schema import SchemaBase


class CategoryBase(SchemaBase):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    sort_order: int = 0


class CreateCategoryParam(CategoryBase):
    # Derived from the name when omitted.
    slug: str | None = Field(default=None, max_length=140, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


class UpdateCategoryParam(SchemaBase):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(default=None, max_length=140, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    sort_order: int | None = None


class GetCategoryDetail(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str


class ProductCategoryInfo(SchemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class ProductBase(SchemaBase):
    category_id: int
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None
    price: int = Field(ge=0, description='Prix en FCFA')
    stock: int = Field(default=0, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    gallery: list[str] = Field(default_factory=list, max_length=12)
    model_3d_url: str | None = Field(default=None, max_length=500)
    volume: str | None = Field(default=None, max_length=60)
    ingredients: str | None = None
    is_active: bool = True
    is_featured: bool = False


class CreateProductParam(ProductBase):
    slug: str | None = Field(default=None, max_length=180, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


class UpdateProductParam(SchemaBase):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(default=None, max_length=180, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    description: str | None = None
    price: int | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)
    gallery: list[str] | None = Field(default=None, max_length=12)
    model_3d_url: str | None = Field(default=None, max_length=500)
    volume: str | None = Field(default=None, max_length=60)
    ingredients: str | None = None
    is_active: bool | None = None
    is_featured: bool | None = None


class GetProductDetail(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    category: ProductCategoryInfo | None = None
    created_time: datetime

    @computed_field
    @property
    def is_available(self) -> bool:
        """Orderable right now: published and in stock."""
        return self.is_active and self.stock > 0
