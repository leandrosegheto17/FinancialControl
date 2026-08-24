-- Default categories: user_id = NULL marks them as system defaults
-- (read-only for every user, per categories RLS policies).
insert into public.categories (name, icon, color, kind, is_system_default) values
  ('Salário', 'wallet', '#22c55e', 'income', true),
  ('Investimentos', 'trending-up', '#16a34a', 'income', true),
  ('Outras Receitas', 'plus-circle', '#4ade80', 'income', true),
  ('Moradia', 'home', '#f97316', 'expense', true),
  ('Alimentação', 'utensils', '#ef4444', 'expense', true),
  ('Transporte', 'car', '#3b82f6', 'expense', true),
  ('Lazer', 'gamepad-2', '#a855f7', 'expense', true),
  ('Saúde', 'heart-pulse', '#ec4899', 'expense', true),
  ('Educação', 'graduation-cap', '#0ea5e9', 'expense', true),
  ('Compras', 'shopping-bag', '#eab308', 'expense', true),
  ('Assinaturas', 'refresh-cw', '#8b5cf6', 'expense', true),
  ('Outras Despesas', 'more-horizontal', '#64748b', 'expense', true);
