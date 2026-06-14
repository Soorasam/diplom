import { useRef, useState } from "react"
import { ImagePlus, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react"

import {
  useAdminProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useUploadProductImage,
} from "@/entities/admin/api/useAdmin"
import { useCategories } from "@/entities/product/api/useProducts"
import type { Product } from "@/shared/api/api-types"
import { getApiErrorMessage } from "@/shared/lib/api-form-errors"
import { formatPrice } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { ProductImage } from "@/shared/ui/product-image/ProductImage"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const selectClass =
  "w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"

type ProductFormState = {
  name: string
  categoryId: string
  description: string
  unit: string
  price: string
  weightKg: string
  requiresPrescription: boolean
}

const emptyForm = (categoryId = ""): ProductFormState => ({
  name: "",
  categoryId,
  description: "",
  unit: "шт",
  price: "",
  weightKg: "1",
  requiresPrescription: false,
})

const formFromProduct = (product: Product): ProductFormState => ({
  name: product.name,
  categoryId: product.categoryId,
  description: product.description,
  unit: product.unit,
  price: String(product.price),
  weightKg: String(product.weightKg),
  requiresPrescription: false,
})

const parsePrice = (value: string) => {
  const normalized = value.replace(",", ".").trim()
  const num = Number(normalized)
  return Number.isFinite(num) && num >= 0 ? num : null
}

const ProductFormFields = ({
  form,
  setForm,
  categories,
  idPrefix,
}: {
  form: ProductFormState
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>
  categories: { id: string; name: string }[] | undefined
  idPrefix: string
}) => (
  <>
    <Input
      label="Название"
      value={form.name}
      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
      placeholder="Молоко 3,2%"
      required
    />

    <label className="block w-full">
      <span className="mb-2 block text-xs font-medium text-slate-500">Категория</span>
      <select
        className={selectClass}
        value={form.categoryId}
        onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
        required
      >
        <option value="">Выберите категорию</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </label>

    <label className="block w-full">
      <span className="mb-2 block text-xs font-medium text-slate-500">Описание</span>
      <textarea
        className={`${selectClass} min-h-20 resize-y`}
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Краткое описание товара"
      />
    </label>

    <div className="grid gap-3 sm:grid-cols-3">
      <Input
        label="Цена, ₽"
        type="number"
        min={0}
        step="0.01"
        value={form.price}
        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
        required
      />
      <Input
        label="Единица"
        value={form.unit}
        onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
        placeholder="шт, кг, л"
      />
      <Input
        label="Вес, кг"
        type="number"
        min={0}
        step="0.001"
        value={form.weightKg}
        onChange={(e) => setForm((prev) => ({ ...prev, weightKg: e.target.value }))}
      />
    </div>

    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        id={`${idPrefix}-prescription`}
        type="checkbox"
        checked={form.requiresPrescription}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, requiresPrescription: e.target.checked }))
        }
        className="h-4 w-4 rounded border-slate-300"
      />
      Требуется рецепт
    </label>
  </>
)

export const AdminProductsPage = () => {
  const { data: products, isLoading, isError, error } = useAdminProducts()
  const { data: categories } = useCategories()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const uploadImage = useUploadProductImage()

  const defaultCategoryId = categories?.[0]?.id ?? ""
  const [createForm, setCreateForm] = useState<ProductFormState>(() => emptyForm())
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ProductFormState>(() => emptyForm())
  const [editError, setEditError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)

  const canCreate =
    createForm.name.trim().length >= 2 &&
    createForm.categoryId.length > 0 &&
    parsePrice(createForm.price) !== null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!canCreate) return

    const price = parsePrice(createForm.price)
    const weight = Number(createForm.weightKg.replace(",", "."))
    if (price === null) {
      setCreateError("Укажите корректную цену")
      return
    }

    try {
      await create.mutateAsync({
        name: createForm.name.trim(),
        categoryId: createForm.categoryId,
        description: createForm.description.trim() || undefined,
        unit: createForm.unit.trim() || "шт",
        priceEstimate: price,
        weightKg: Number.isFinite(weight) && weight >= 0 ? weight : 1,
        requiresPrescription: createForm.requiresPrescription,
      })
      setCreateForm(emptyForm(defaultCategoryId))
    } catch (err) {
      setCreateError(getApiErrorMessage(err, "Не удалось добавить товар"))
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditForm(formFromProduct(product))
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setEditError(null)

    const price = parsePrice(editForm.price)
    const weight = Number(editForm.weightKg.replace(",", "."))
    if (price === null) {
      setEditError("Укажите корректную цену")
      return
    }

    try {
      await update.mutateAsync({
        id: editingId,
        payload: {
          name: editForm.name.trim(),
          categoryId: editForm.categoryId,
          description: editForm.description.trim() || undefined,
          unit: editForm.unit.trim() || "шт",
          priceEstimate: price,
          weightKg: Number.isFinite(weight) && weight >= 0 ? weight : 1,
          requiresPrescription: editForm.requiresPrescription,
        },
      })
      setEditingId(null)
    } catch (err) {
      setEditError(getApiErrorMessage(err, "Не удалось сохранить изменения"))
    }
  }

  const handleDelete = async (product: Product) => {
    const label = product.isActive === false ? "удалить навсегда из каталога" : "скрыть из каталога"
    if (!window.confirm(`Вы уверены, что хотите ${label} «${product.name}»?`)) return

    try {
      await remove.mutateAsync(product.id)
      if (editingId === product.id) cancelEdit()
    } catch (err) {
      window.alert(getApiErrorMessage(err, "Не удалось удалить товар"))
    }
  }

  const handleRestore = async (product: Product) => {
    try {
      await update.mutateAsync({
        id: product.id,
        payload: { isActive: true },
      })
    } catch (err) {
      window.alert(getApiErrorMessage(err, "Не удалось восстановить товар"))
    }
  }

  const triggerImageUpload = (productId: string) => {
    setUploadTargetId(productId)
    fileInputRef.current?.click()
  }

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !uploadTargetId) return

    try {
      await uploadImage.mutateAsync({ id: uploadTargetId, file })
    } catch (err) {
      window.alert(getApiErrorMessage(err, "Не удалось загрузить изображение"))
    } finally {
      setUploadTargetId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Товары" subtitle="Управление каталогом: добавление, изменение, скрытие" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />

      <Card className="border-blue-100 bg-blue-50/30">
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-900">Добавить товар</p>

          <ProductFormFields
            form={createForm.categoryId ? createForm : { ...createForm, categoryId: defaultCategoryId }}
            setForm={setCreateForm}
            categories={categories}
            idPrefix="create"
          />

          {createError ? <p className="text-sm text-red-600">{createError}</p> : null}

          <Button
            type="submit"
            leftIcon={<Plus size={16} />}
            disabled={!canCreate || create.isPending}
            loading={create.isPending}
          >
            Добавить
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-800">
            {(error as Error)?.message ?? "Не удалось загрузить товары"}
          </p>
        </Card>
      ) : products && products.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const isEditing = editingId === product.id
            const inactive = product.isActive === false

            return (
              <Card
                key={product.id}
                className={inactive ? "opacity-70 ring-1 ring-slate-200" : undefined}
              >
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Редактирование</p>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Отмена"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <ProductFormFields
                      form={editForm}
                      setForm={setEditForm}
                      categories={categories}
                      idPrefix={`edit-${product.id}`}
                    />

                    {editError ? <p className="text-sm text-red-600">{editError}</p> : null}

                    <Button type="submit" loading={update.isPending} leftIcon={<Pencil size={16} />}>
                      Сохранить
                    </Button>
                  </form>
                ) : (
                  <>
                    <div className="relative">
                      <ProductImage src={product.imageUrl} alt={product.name} variant="card" />
                      {inactive ? (
                        <div className="absolute left-2 top-2">
                          <Badge variant="default">Скрыт</Badge>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col gap-1">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-sm font-bold text-blue-700">{formatPrice(product.price)}</p>
                        <p className="text-xs text-slate-400">
                          {product.unit} · {product.weightKg} кг
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Pencil size={14} />}
                        onClick={() => startEdit(product)}
                      >
                        Изменить
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<ImagePlus size={14} />}
                        onClick={() => triggerImageUpload(product.id)}
                        loading={uploadImage.isPending && uploadTargetId === product.id}
                      >
                        Фото
                      </Button>
                      {inactive ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRestore(product)}
                          loading={update.isPending}
                        >
                          Вернуть
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 size={14} />}
                          onClick={() => handleDelete(product)}
                          loading={remove.isPending}
                        >
                          Скрыть
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={ShoppingBag} title="Товаров нет" />
      )}
    </div>
  )
}
