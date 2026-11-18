<script setup lang="ts">
import { RouterLink } from 'vue-router'

const classes = {
  root: 'mt-16 border-t border-slate-200 bg-white',
  inner: 'mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3',
  title: 'mb-3 font-semibold',
  list: 'flex flex-col gap-2 text-slate-600',
  link: 'hover:text-brand-600',
  note: 'text-sm text-slate-500',
}
</script>

<template>
  <footer :class="classes.root">
    <div :class="classes.inner">
      <div>
        <p :class="classes.title">Магазин Макса</p>
        <p :class="classes.note">Демо-версия. Юридическая информация и политика обработки данных будут предоставлены заказчиком.</p>
      </div>
      <div>
        <p :class="classes.title">Покупателям</p>
        <ul :class="classes.list">
          <li><RouterLink to="/catalog" :class="classes.link">Каталог</RouterLink></li>
          <li><RouterLink to="/cart" :class="classes.link">Корзина</RouterLink></li>
          <li><RouterLink to="/about" :class="classes.link">О магазине</RouterLink></li>
          <li><RouterLink to="/delivery" :class="classes.link">Доставка и оплата</RouterLink></li>
          <li><RouterLink to="/contacts" :class="classes.link">Контакты</RouterLink></li>
        </ul>
      </div>
    </div>
  </footer>
</template>
