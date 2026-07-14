<template>
  <div class="mc-head cx-hd" :class="{ 'preview-highlight': tab === 'design', 'preview-clickable-section': tab !== 'design' }" data-label="Design" :style="{ background: f.color_primary }" @click="$emit('select-tab', isClosedPreview ? 'office_hours' : 'design')">
    <button class="mc-close" :style="{ color: f.color_button_text, background: 'rgba(0,0,0,.15)' }" @click.stop="$emit('close')">✕</button>
    
    <!-- Render logo at top of header in floating theme -->
    <div v-if="f.theme_style === 'floating' && f.logo_url" class="mc-logo-header" style="margin-bottom: 12px; text-align: center; display: flex; align-items: center; justify-content: center;" @click.stop="$emit('select-tab', 'design')">
      <img :src="f.logo_url" alt="logo" :style="{ maxHeight: '30px', maxWidth: f.logo_width ? f.logo_width + 'px' : 'auto', objectFit: 'contain', filter: f.color_button_text === '#ffffff' ? 'brightness(0) invert(1)' : 'none' }"/>
    </div>
    
    <template v-if="isClosedPreview">
      <!-- Inline editable closed Title -->
      <div 
        class="mc-title el-editable" 
        :style="{ color: f.color_button_text }"
        contenteditable="true"
        @blur="e => f.office_hours_out_title = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit title inline"
        @click.stop
      >
        {{ f.office_hours_out_title || 'Office Closed' }}
      </div>
      <!-- Inline editable closed Subtitle -->
      <div 
        class="mc-sub el-editable" 
        :style="{ color: f.color_button_text }"
        contenteditable="true"
        @blur="e => f.office_hours_out_subtitle = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit subtitle inline"
        @click.stop
      >
        {{ f.office_hours_out_subtitle || 'We are currently offline. Please leave your details below and we will contact you during business hours!' }}
      </div>
    </template>
    <template v-else>
      <!-- Inline editable Title -->
      <div 
        class="mc-title el-editable" 
        :style="{ color: f.color_button_text }"
        contenteditable="true"
        @blur="e => f.widget_title = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit title inline"
        @click.stop
      >
        {{ f.widget_title || 'Need Expert Business Setup Advice?' }}
      </div>

      <!-- Inline editable Subtitle -->
      <div 
        class="mc-sub el-editable" 
        :style="{ color: f.color_button_text }"
        contenteditable="true"
        @blur="e => f.widget_subtitle = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit subtitle inline"
        @click.stop
      >
        {{ f.widget_subtitle || 'We will call you in 55 seconds!' }}
      </div>
    </template>
  </div>

  <!-- Agent profile (preview) -->
  <div
    v-if="f.show_agent"
    class="mc-agent"
    id="cx-agent"
    :class="{ 'preview-highlight': tab === 'agents' || (isClosedPreview && tab === 'office_hours'), 'preview-clickable-section': tab !== 'agents' && (!isClosedPreview || tab !== 'office_hours') }"
    :data-label="isClosedPreview ? 'Office Hours' : 'Agents'"
    :style="f.theme_style === 'split' && f.agent_bg_url ? {
      background: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${f.agent_bg_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } : {}"
    @click="$emit('select-tab', isClosedPreview ? 'office_hours' : 'agents')"
  >
    <template v-if="isClosedPreview">
      <div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px 0;">
        <div style="font-size: 32px; margin-bottom: 6px;">⏳</div>
        <div 
          class="el-editable"
          contenteditable="true"
          @blur="e => f.office_hours_out_status = e.target.innerText.trim()"
          @keydown.enter.prevent="e => e.target.blur()"
          title="Click to edit status headline inline"
          @click.stop
          :style="{ color: f.theme_style === 'split' ? f.color_button_text : f.color_primary }" 
          style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; min-width: 80px;"
        >
          {{ f.office_hours_out_status || "We're Offline" }}
        </div>
        <div 
          class="el-editable"
          contenteditable="true"
          @blur="e => f.office_hours_out_sub = e.target.innerText.trim()"
          @keydown.enter.prevent="e => e.target.blur()"
          title="Click to edit subtext inline"
          @click.stop
          :style="{ color: f.theme_style === 'split' ? f.color_button_text : '#6b7280', opacity: 0.85 }" 
          style="font-size: 10px; margin-top: 2px; padding: 0 5px; line-height: 1.3; display: inline-block; min-width: 100px;"
        >
          {{ f.office_hours_out_sub || "Leave a message and we'll reply during business hours!" }}
        </div>
      </div>
    </template>
    <template v-else>
      <!-- Logo displayed above agent details in Split Column theme -->
      <div v-if="f.theme_style === 'split' && f.logo_url" class="mc-logo-agent" style="margin-bottom: 14px;">
        <img :src="f.logo_url" alt="logo" :style="{ maxHeight: f.logo_height ? f.logo_height + 'px' : '36px', maxWidth: f.logo_width ? f.logo_width + 'px' : 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }"/>
      </div>

      <div class="mc-av-container">
        <svg v-if="f.agent_rotation_enabled" class="mc-av-ring-svg" viewBox="0 0 76 76">
          <circle class="mc-av-ring-bg" :style="{ stroke: f.theme_style === 'split' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)' }" cx="38" cy="38" r="33" />
          <circle class="mc-av-ring-progress" :style="{ stroke: f.theme_style === 'split' ? f.color_button_text || '#ffffff' : f.color_primary }" cx="38" cy="38" r="33" />
        </svg>
        <img
          :style="{ borderRadius: f.avatar_shape === 'circle' ? '50%' : f.avatar_shape === 'rounded' ? '12px' : '0' }"
          src="https://ui-avatars.com/api/?name=John+D&background=1f6feb&color=fff&size=128"
          alt="Agent"
          class="mc-av"
        />
      </div>
      <div class="mc-av-name">John Doe</div>
      
      <!-- Inline editable Agent Status -->
      <div 
        class="mc-av-sub el-editable"
        contenteditable="true"
        @blur="e => f.agent_status_text = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit status text inline"
        @click.stop
        style="display: inline-block; min-width: 100px;"
      >
        {{ f.agent_status_text || 'Will answer your call' }}
      </div>
    </template>
  </div>

  <!-- Form -->
  <div v-if="!success" class="mc-body cx-body" :class="{ 'preview-highlight': tab === 'fields', 'preview-clickable-section': tab !== 'fields' }" data-label="Fields" @click="$emit('select-tab', 'fields')">
    <template v-for="field in (f.fields_order || 'first_name,last_name,email,phone').split(',')" :key="field">
      <!-- First Name -->
      <div v-if="field === 'first_name'" class="mc-field">
        <label>First Name *</label>
        <div class="mc-inp">John</div>
      </div>
      
      <!-- Last Name -->
      <div v-if="field === 'last_name' && f.require_lastname" class="mc-field">
        <label>Last Name *</label>
        <div class="mc-inp">Doe</div>
      </div>
      
      <!-- Email -->
      <div v-if="field === 'email' && f.require_email" class="mc-field">
        <label>Email *</label>
        <div class="mc-inp">john@example.com</div>
      </div>
      
      <!-- Phone -->
      <div v-if="field === 'phone'" class="mc-field" :class="{ 'preview-highlight': tab === 'phone', 'preview-clickable-section': tab !== 'phone' }" data-label="Phone" @click.stop="$emit('select-tab', 'phone')">
        <label>Phone Number *</label>
        <div class="mc-iti">
          <div class="mc-iti-flag">{{ f.country_flag || '🇦🇪' }} <span>{{ f.country_code || '+971' }}</span> ▾</div>
          <div class="mc-inp mc-iti-num">50 123 4567</div>
        </div>
      </div>
    </template>

    <!-- Inline editable CTA Button -->
    <button
      class="mc-cta cx-btn el-editable-btn"
      :class="{ 'preview-highlight': tab === 'text' }"
      :style="{ background: f.color_primary, color: f.color_button_text }"
      @click.stop
      style="pointer-events: none;"
    >
      <span v-if="isClosedPreview">Submit Inquiry</span>
      <span
        v-else
        contenteditable="true"
        @blur="e => f.widget_button_text = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit button label inline"
        style="display: inline-block; width: 100%; min-width: 50px; pointer-events: auto;"
      >{{ f.widget_button_text || 'Call me!' }}</span>
    </button>
  </div>

  <!-- Success -->
  <div v-else class="mc-success cx-ok" :class="{ 'preview-highlight': tab === 'text', 'preview-clickable-section': tab !== 'text' }" data-label="Text" @click="$emit('select-tab', isClosedPreview ? 'office_hours' : 'text')">
    <span class="mc-ok-icon" :style="parseIconStyle(f.icon_success_style)" v-html="f.icon_success_html || '&#x2705;'"></span>
    
    <template v-if="isClosedPreview">
      <div class="mc-ok-title">Inquiry Received</div>
      <!-- Inline editable success message for closed hours -->
      <div 
        class="mc-ok-msg el-editable"
        contenteditable="true"
        @blur="e => f.office_hours_out_msg = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit offline message inline"
        @click.stop
      >
        {{ f.office_hours_out_msg || 'We have received your inquiry. You will be contacted shortly during business hours!' }}
      </div>
    </template>
    <template v-else>
      <!-- Inline editable Success Title -->
      <div 
        class="mc-ok-title el-editable"
        contenteditable="true"
        @blur="e => f.widget_success_title = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit success headline inline"
        @click.stop
      >
        {{ f.widget_success_title || 'Calling you now…' }}
      </div>

      <!-- Inline editable Success Message -->
      <div 
        class="mc-ok-msg el-editable"
        contenteditable="true"
        @blur="e => f.widget_success_msg = e.target.innerText.trim()"
        @keydown.enter.prevent="e => e.target.blur()"
        title="Click to edit success message inline"
        @click.stop
      >
        {{ f.widget_success_msg || 'Please keep your phone nearby.' }}
      </div>
    </template>
    <button class="mc-back" @click.stop="$emit('back')">← Back</button>
  </div>

  <!-- Branding footer -->
  <div v-if="f.show_branding !== false" class="mc-brand" id="cx-brand-wrap" :class="{ 'preview-highlight': tab === 'advanced', 'preview-clickable-section': tab !== 'advanced' }" data-label="Advanced" @click.stop="$emit('select-tab', 'advanced')">
    {{ f.branding_text || 'Powered by 3CX Widget' }}
  </div>
</template>

<script setup>
const props = defineProps({ f: Object, success: Boolean, isClosedPreview: Boolean, tab: String })
defineEmits(['close', 'submit', 'back', 'select-tab'])

const parseIconStyle = (styleStr) => {
  if (!styleStr) return ''
  return styleStr.replace(/__PRIMARY__/g, props.f.color_primary || '#0b4526')
}
</script>

<style scoped>
/* Header */
.mc-head { padding: 14px 14px 12px; position: relative; cursor: pointer; }
.mc-close { position: absolute; top: 9px; right: 9px; border: none; width: 23px; height: 23px; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.mc-title { font-size: 13px; font-weight: 700; line-height: 1.4; padding-right: 28px; margin-bottom: 2px; }
.mc-sub { font-size: 11px; opacity: .87; }

/* Agent */
.mc-agent { text-align: center; padding: 12px 14px 0; background: #f8fafc; border-bottom: 1px solid #eef0f3; cursor: pointer; }
.mc-av-container {
  position: relative;
  width: 50px;
  height: 50px;
  margin: 0 auto 5px;
  display: inline-block;
}
.mc-av-ring-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 114%;
  height: 114%;
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: center;
  pointer-events: none;
  z-index: 2;
}
.mc-av-ring-bg {
  fill: none;
  stroke-width: 2.2;
}
.mc-av-ring-progress {
  fill: none;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: 207.35;
  stroke-dashoffset: 75; /* Demonstrates a partial loading circle in preview */
}
.mc-av {
  width: 50px !important;
  height: 50px !important;
  object-fit: cover;
  display: block;
  margin: 0 !important;
  border: 2px solid transparent !important;
}
.mc-av-name { font-size: 13px; font-weight: 700; color: #111; }
.mc-av-sub { font-size: 11px; color: #888; margin-bottom: 10px; }

/* Form */
.mc-body { padding: 11px 14px 14px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; }
.mc-field { display: flex; flex-direction: column; gap: 3px; }
.mc-field label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
.mc-inp { background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 7px; padding: 7px 10px; font-size: 12px; color: #374151; }

/* ITI simulation */
.mc-iti { display: flex; border: 1.5px solid #e5e7eb; border-radius: 7px; overflow: hidden; cursor: pointer; }
.mc-iti-flag { background: #fff; border-right: 1.5px solid #e5e7eb; padding: 7px 8px; font-size: 11px; display: flex; align-items: center; gap: 3px; color: #374151; cursor: default; white-space: nowrap; }
.mc-iti-flag span { font-size: 10px; }
.mc-iti-num { flex: 1; border: none; border-radius: 0; background: #fff; color: #9ca3af; }

/* CTA */
.mc-cta { width: 100%; border: none; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 2px; transition: opacity .15s; }
.mc-cta:hover { opacity: .88; }

/* Success */
.mc-success { padding: 22px 14px 18px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.mc-ok-icon { font-size: 38px; }
.mc-ok-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 2px; }
.mc-ok-msg { font-size: 11px; color: #6b7280; line-height: 1.4; }
.mc-back { background: #f3f4f6; border: 1px solid #e5e7eb; color: #6b7280; padding: 5px 12px; border-radius: 7px; font-size: 11px; cursor: pointer; margin-top: 4px; }

/* Elementor inline editable styles */
.el-editable {
  position: relative;
  outline: none;
  cursor: text;
  transition: all 0.15s ease;
  border: 1px dashed transparent;
  border-radius: 4px;
  padding: 1px 3px;
}
.el-editable:hover {
  border-color: #388bfd !important;
  background: rgba(56, 139, 253, 0.08) !important;
}
.el-editable:focus {
  border-color: #388bfd !important;
  background: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 0 0 2px rgba(56, 139, 253, 0.3) !important;
}

.el-editable-btn {
  position: relative;
  outline: none;
  border: 1.5px dashed transparent !important;
}
.el-editable-btn:hover {
  border-color: #388bfd !important;
}
.el-editable-btn span {
  outline: none;
  cursor: text;
}
.mc-brand {
  text-align: center;
  padding: 0 0 14px;
  font-size: 10px;
  color: #9ca3af;
  background: #fff;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}
.mc-brand:hover {
  text-decoration: underline;
  color: #388bfd;
}

/* Highlights and Tooltips */
.preview-highlight {
  outline: 2px dashed var(--accent) !important;
  outline-offset: 1px;
  animation: outline-pulse 2s infinite ease-in-out;
  border-radius: 4px;
}
@keyframes outline-pulse {
  0%, 100% {
    outline-color: rgba(88, 166, 255, 0.4);
    box-shadow: 0 0 4px rgba(88, 166, 255, 0.1);
  }
  50% {
    outline-color: rgba(88, 166, 255, 1);
    box-shadow: 0 0 12px rgba(88, 166, 255, 0.3);
  }
}
.preview-clickable-section {
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer !important;
}
.preview-clickable-section:hover {
  outline: 1.5px dashed var(--green) !important;
  outline-offset: 1px;
  background: rgba(63, 185, 80, 0.03) !important;
}
.preview-clickable-section::after {
  content: attr(data-label);
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--green);
  color: white;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transform: translateY(-2px);
  transition: all 0.18s ease;
  pointer-events: none;
  z-index: 10;
  text-transform: uppercase;
}
.preview-clickable-section:hover::after {
  opacity: 1;
  transform: translateY(0);
}
</style>
