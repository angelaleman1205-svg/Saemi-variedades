import { supabase } from './supabaseClient';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === 'string' && uuidPattern.test(value);

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    image: row.image_url || '/img/productos/top-1.jpeg',
    stock: row.stock,
    createdAt: row.created_at
  };
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password_hash,
    role: row.role,
    address: row.address || '',
    phone: row.phone || '',
    createdAt: row.created_at
  };
}

function mapOrder(row) {
  const user = row.users ? mapUser(row.users) : row.user || null;
  const items = (row.order_items || row.items || []).map((item) => {
    const product = item.products ? mapProduct(item.products) : item;
    return {
      ...product,
      quantity: item.quantity || product.quantity || 1,
      price: Number(item.unit_price || product.price || 0)
    };
  });

  return {
    id: row.id,
    user,
    userId: row.user_id,
    address: row.address,
    total: Number(row.total),
    status: row.status,
    items,
    createdAt: row.created_at
  };
}

function tableFor(name) {
  if (!['products', 'users', 'orders'].includes(name)) {
    throw new Error(`Tabla no soportada: ${name}`);
  }
  return name;
}

function mapRow(name, row) {
  if (name === 'products') return mapProduct(row);
  if (name === 'users') return mapUser(row);
  if (name === 'orders') return mapOrder(row);
  return row;
}

function toDbRow(name, data) {
  if (name === 'products') {
    return {
      ...(isUuid(data.id) ? { id: data.id } : {}),
      name: data.name,
      description: data.description || null,
      price: Number(data.price),
      category: data.category,
      image_url: data.image || data.image_url || '/img/productos/top-1.jpeg',
      stock: Number(data.stock || 0)
    };
  }

  if (name === 'users') {
    return {
      ...(isUuid(data.id) ? { id: data.id } : {}),
      name: data.name,
      email: data.email?.toLowerCase(),
      password_hash: data.passwordHash || data.password_hash || data.password || null,
      role: data.role || 'cliente',
      address: data.address || '',
      phone: data.phone || ''
    };
  }

  if (name === 'orders') {
    return {
      ...(isUuid(data.id) ? { id: data.id } : {}),
      user_id: isUuid(data.user?.id || data.userId) ? data.user?.id || data.userId : null,
      address: data.address,
      total: Number(data.total),
      status: data.status || 'Pendiente'
    };
  }

  return data;
}

async function selectAll(name) {
  if (name === 'orders') {
    return supabase
      .from('orders')
      .select('*, users(*), order_items(*, products(*))')
      .order('created_at', { ascending: true });
  }

  return supabase.from(tableFor(name)).select('*').order('created_at', { ascending: true });
}

export async function readData(name) {
  const { data, error } = await selectAll(name);
  if (error) throw error;
  return data.map((row) => mapRow(name, row));
}

export async function getRecord(name, id) {
  const records = await readData(name);
  return records.find((record) => record.id === id) || null;
}

export async function createRecord(name, data) {
  if (name === 'orders') {
    const { data: order, error } = await supabase
      .from('orders')
      .insert(toDbRow('orders', data))
      .select('*, users(*)')
      .single();

    if (error) throw error;

    const items = (data.items || []).filter((item) => isUuid(item.id));
    if (items.length) {
      const { error: itemsError } = await supabase.from('order_items').insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.price)
        }))
      );

      if (itemsError) throw itemsError;
    }

    return getRecord('orders', order.id);
  }

  const { data: created, error } = await supabase
    .from(tableFor(name))
    .insert(toDbRow(name, data))
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(name, created);
}

export async function updateRecord(name, id, data) {
  const { data: updated, error } = await supabase
    .from(tableFor(name))
    .update(toDbRow(name, { ...data, id }))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapRow(name, updated);
}

export async function deleteRecord(name, id) {
  const current = await getRecord(name, id);
  if (!current) return null;

  const { error } = await supabase.from(tableFor(name)).delete().eq('id', id);
  if (error) throw error;
  return current;
}

export async function writeData(name, data) {
  const saved = [];
  for (const item of data) {
    saved.push(item.id ? await updateRecord(name, item.id, item) : await createRecord(name, item));
  }
  return saved;
}
