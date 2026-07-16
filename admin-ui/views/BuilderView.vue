<template>
  <AppLayout>
    <div class="bldr">

      <!-- ══ TOP BAR ══════════════════════════════════════════════════════ -->
      <header class="bldr-bar">
        <div class="bldr-bar-l">
          <router-link to="/widgets" class="back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            All Widgets
          </router-link>
          <div class="bldr-bar-sep"></div>
          <div>
            <div class="bldr-name">{{ widget?.name || 'Loading…' }}</div>
            <div class="bldr-sub">Widget Builder</div>
          </div>
        </div>
        <div class="bldr-bar-r">
          <div class="device-toggle">
            <button :class="['dev-btn', {active: device==='desktop'}]" @click="device='desktop'" title="Desktop">
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>
            </button>
            <button :class="['dev-btn', {active: device==='mobile'}]" @click="device='mobile'" title="Mobile">
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
            </button>
          </div>
          <a v-if="widget" :href="`/preview/${widget.id}`" target="_blank" class="btn btn-ghost btn-sm">↗ Open live</a>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : '💾 Save Changes' }}
          </button>
        </div>
      </header>

      <div class="bldr-body">

        <!-- ══ ICON NAV ═══════════════════════════════════════════════════ -->
        <nav class="bldr-nav">
          <button v-for="t in tabs" :key="t.id"
            :class="['bnav-btn', {active: tab===t.id}]"
            @click="tab=t.id" :title="t.label">
            <span class="bnav-icon" v-html="t.icon"></span>
            <span class="bnav-txt">{{ t.label }}</span>
          </button>
        </nav>

        <!-- ══ SETTINGS PANEL ════════════════════════════════════════════ -->
        <aside class="bldr-panel">
          <div class="panel-inner">

            <!-- ── DESIGN ─────────────────────────────────────────────── -->
            <template v-if="tab==='design'">
              <div class="ps-head">Colors</div>
              <div class="ps-row">
                <div class="ps-field">
                  <label>Button Color</label>
                  <div class="cp-wrap">
                    <div class="cp-swatch" :style="{background:f.color_primary}" @click="$refs.cp1.click()">
                      <input ref="cp1" type="color" :value="f.color_primary" @input="e=>f.color_primary=e.target.value" class="cp-native"/>
                    </div>
                    <input class="cp-hex" :value="f.color_primary" @change="e=>{ if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) f.color_primary=e.target.value }" maxlength="7"/>
                    <div class="cp-presets">
                      <div v-for="c in palettes" :key="c" class="cp-dot" :style="{background:c}" :class="{sel:f.color_primary===c}" @click="f.color_primary=c"/>
                    </div>
                  </div>
                </div>
                <div class="ps-field">
                  <label>Text / Icon Color</label>
                  <div class="cp-wrap">
                    <div class="cp-swatch" :style="{background:f.color_button_text}" @click="$refs.cp2.click()">
                      <input ref="cp2" type="color" :value="f.color_button_text" @input="e=>f.color_button_text=e.target.value" class="cp-native"/>
                    </div>
                    <input class="cp-hex" :value="f.color_button_text" @change="e=>{ if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) f.color_button_text=e.target.value }" maxlength="7"/>
                    <div class="cp-presets">
                      <div v-for="c in ['#ffffff','#000000','#f9fafb','#111827','#fbbf24']" :key="c" class="cp-dot" :style="{background:c}" :class="{sel:f.color_button_text===c}" @click="f.color_button_text=c"/>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Layout & Position</div>
              <div class="ps-field">
                <label>Widget Position</label>
                <div class="pos-grid">
                  <div v-for="p in positions" :key="p.val" :class="['pos-opt', {active: f.position===p.val}]" @click="f.position=p.val">
                    {{ p.icon }}<br/><span>{{ p.label }}</span>
                  </div>
                </div>
              </div>
              <div class="ps-field">
                <label>Popup Style</label>
                <div class="style-opts">
                  <div v-for="s in popupStyles" :key="s.val" :class="['style-opt', {active: f.popup_style===s.val}]" @click="f.popup_style=s.val">
                    <div class="style-thumb" :style="s.css"></div>
                    <span>{{ s.label }}</span>
                  </div>
                </div>
              </div>
              <div class="ps-field">
                <label>Theme Template</label>
                <div class="theme-grid">
                  <div v-for="t in themeStyles" :key="t.val"
                    :class="['theme-opt', {active: f.theme_style===t.val}]"
                    @click="f.theme_style=t.val"
                  >
                    <!-- Preview Mockup -->
                    <div class="theme-preview-mock" :style="themePreviewStyle(t.val)">
                      <div class="theme-mock-bar"></div>
                      <div class="theme-mock-body">
                        <div class="theme-mock-line" style="width:70%"></div>
                        <div class="theme-mock-line" style="width:50%"></div>
                      </div>
                      <div class="theme-mock-btn" :style="{ background: f.color_primary }"></div>
                    </div>
                    <!-- Name & active check -->
                    <div class="theme-opt-name">
                      <span>{{ t.label }}</span>
                      <svg v-if="f.theme_style===t.val" viewBox="0 0 24 24" fill="currentColor" width="13" height="13" class="theme-check-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ps-field">
                <label>Floating Button Design</label>
                <div class="theme-grid">
                  <div v-for="d in fabDesigns" :key="d.val"
                    :class="['theme-opt', {active: f.animation_style===d.val}]"
                    @click="f.animation_style=d.val"
                  >
                    <!-- Preview Mockup for FAB Design -->
                    <div class="fab-preview-mock">
                      <div class="mock-fab-wrap" :class="'cx-fab-' + d.val" :style="{ '--btn-color': f.color_button_text }">
                        <button type="button" class="mock-fab-btn" :style="{ background: f.color_primary }">
                          <svg viewBox="0 0 24 24" :fill="f.color_button_text" width="12" height="12"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                        </button>
                      </div>
                    </div>
                    <!-- Name & active check -->
                    <div class="theme-opt-name">
                      <span>{{ d.label }}</span>
                      <svg v-if="f.animation_style===d.val" viewBox="0 0 24 24" fill="currentColor" width="13" height="13" class="theme-check-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ps-field">
                <label>Tooltip Design</label>
                <div class="theme-grid">
                  <div v-for="t in tooltipStyles" :key="t.val"
                    :class="['theme-opt', {active: f.tooltip_style===t.val}]"
                    @click="f.tooltip_style=t.val"
                  >
                    <!-- Preview Mockup for Tooltip Design -->
                    <div class="tooltip-preview-mock">
                      <div class="mock-tooltip-bubble" :class="'cx-tooltip-' + t.val" :style="{ '--primary': f.color_primary, '--btn-color': f.color_button_text }">
                        <span>Preview</span>
                      </div>
                    </div>
                    <!-- Name & active check -->
                    <div class="theme-opt-name">
                      <span>{{ t.label }}</span>
                      <svg v-if="f.tooltip_style===t.val" viewBox="0 0 24 24" fill="currentColor" width="13" height="13" class="theme-check-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ps-row-2">
                <div class="ps-field">
                  <label>Border Radius</label>
                  <div class="slider-wrap">
                    <input type="range" min="0" max="32" v-model.number="f.border_radius" class="slider"/>
                    <span class="slider-val">{{ f.border_radius }}px</span>
                  </div>
                </div>
                <div class="ps-field">
                  <label>Button Size</label>
                  <div class="slider-wrap">
                    <input type="range" min="48" max="80" v-model.number="f.btn_size" class="slider"/>
                    <span class="slider-val">{{ f.btn_size }}px</span>
                  </div>
                </div>
              </div>
              <div class="ps-row-2">
                <div class="ps-field">
                  <label>Widget Width</label>
                  <div class="slider-wrap">
                    <input type="range" min="260" max="600" v-model.number="f.widget_width" class="slider"/>
                    <span class="slider-val">{{ f.widget_width }}px</span>
                  </div>
                </div>
                <div class="ps-field">
                  <label>Widget Height</label>
                  <div class="slider-wrap" style="align-items: center; gap: 8px;">
                    <input v-if="f.widget_height" type="range" min="300" max="700" v-model.number="f.widget_height" class="slider" style="flex:1; width:auto;"/>
                    <span v-else style="font-size:12px; color:var(--text3); font-style:italic; flex:1; text-align:center; border: 1px dashed var(--border); border-radius:6px; padding:3px 6px; background:rgba(0,0,0,0.08)">Auto Height</span>
                    <button class="btn btn-ghost btn-sm" @click="f.widget_height = f.widget_height ? null : 420" style="padding: 2px 6px; font-size:11px; height:24px; border:1px solid var(--border)">
                      {{ f.widget_height ? 'Auto' : 'Set' }}
                    </button>
                    <span v-if="f.widget_height" class="slider-val" style="min-width: 40px; text-align:right">{{ f.widget_height }}px</span>
                  </div>
                </div>
              </div>
              <div class="ps-field">
                <label>Font Family</label>
                <select v-model="f.font_family" class="sel">
                  <option v-for="fnt in fonts" :key="fnt" :value="fnt">{{ fnt }}</option>
                </select>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Logo</div>
              <div class="ps-field">
                <label>Logo URL <span class="opt-tag">optional</span></label>
                <input v-model="f.logo_url" class="inp" type="url" placeholder="https://yoursite.com/logo.png"/>
                <span class="hint">Shown at top of the modal</span>
              </div>
              <div v-if="f.logo_url" class="logo-preview">
                <img :src="f.logo_url" alt="logo" :style="{ maxHeight: (f.logo_height || 36) + 'px', maxWidth: (f.logo_width || 140) + 'px', objectFit: 'contain' }" @error="e=>e.target.style.display='none'"/>
              </div>
              <div v-if="f.logo_url" class="ps-row-2" style="margin-top: 10px;">
                <div class="ps-field">
                  <label>Logo Max Height (px)</label>
                  <input v-model.number="f.logo_height" class="inp" type="number" min="10" max="200" placeholder="36"/>
                </div>
                <div class="ps-field">
                  <label>Logo Max Width (px)</label>
                  <input v-model.number="f.logo_width" class="inp" type="number" min="10" max="500" placeholder="140"/>
                </div>
              </div>
            </template>

            <!-- ── TEXT ───────────────────────────────────────────────── -->
            <template v-if="tab==='text'">
              <div class="ps-head">Tooltip</div>
              <div class="ps-field">
                <label>Tooltip Message</label>
                <textarea v-model="f.tooltip_text" class="inp textarea" rows="2" placeholder="Click here and we will call you!"></textarea>
              </div>
              <div class="ps-field-check">
                <input type="checkbox" v-model="f.tooltip_autohide" id="tautohide" />
                <label for="tautohide" style="margin-left:6px; cursor:pointer">Auto-hide Tooltip</label>
              </div>
              <div class="ps-field" v-if="f.tooltip_autohide" style="margin-top:8px">
                <label>Auto-hide after (seconds)</label>
                <input type="number" class="inp" v-model.number="f.tooltip_autohide_seconds" min="1" max="120" />
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Modal</div>
              <div class="ps-field"><label>Headline</label><input v-model="f.widget_title" class="inp" type="text" placeholder="Need Expert Business Setup Advice?"/></div>
              <div class="ps-field"><label>Subheadline</label><input v-model="f.widget_subtitle" class="inp" type="text" placeholder="We will call you in 55 seconds!"/></div>
              <div class="ps-field"><label>Button Label</label><input v-model="f.widget_button_text" class="inp" type="text" placeholder="Call me!"/></div>

              <div class="ps-divider"></div>
              <div class="ps-head">Success Screen</div>
              <div class="ps-field"><label>Headline</label><input v-model="f.widget_success_title" class="inp" type="text" placeholder="Calling you now…"/></div>
              <div class="ps-field"><label>Message</label><textarea v-model="f.widget_success_msg" class="inp textarea" rows="2" placeholder="Please keep your phone nearby…"></textarea></div>

              <div class="ps-divider"></div>
              <div class="ps-head">Success / Failed Icons</div>

              <div class="ps-field">
                <label>Icon Size</label>
                <div style="display:flex; gap:12px; align-items:center; margin-bottom: 8px;">
                  <input type="range" v-model="unifiedIconSize" min="20" max="100" style="flex:1" />
                  <span style="font-size:12px; color:var(--text3); font-variant-numeric: tabular-nums; width: 32px;">{{ unifiedIconSize }}px</span>
                </div>
              </div>
              
              <div class="ps-field">
                <label>Success Icon</label>
                <div class="icon-grid">
                  <div v-for="ic in successIconsList" :key="ic.label"
                    :class="['icon-opt', {active: f.icon_success_html===ic.val}]"
                    @click="f.icon_success_html=ic.val"
                    v-html="ic.val"
                    :title="ic.label"
                  ></div>
                </div>
                <div style="margin-top:8px">
                  <input v-model="f.icon_success_html" class="inp" type="text" placeholder="Or paste custom HTML/Emoji"/>
                </div>
              </div>

              <div class="ps-field">
                <label>Failed Icon</label>
                <div class="icon-grid">
                  <div v-for="ic in failedIconsList" :key="ic.label"
                    :class="['icon-opt', {active: f.icon_failed_html===ic.val}]"
                    @click="f.icon_failed_html=ic.val"
                    v-html="ic.val"
                    :title="ic.label"
                  ></div>
                </div>
                <div style="margin-top:8px">
                  <input v-model="f.icon_failed_html" class="inp" type="text" placeholder="Or paste custom HTML/Emoji"/>
                </div>
              </div>
            </template>

            <!-- ── PHONE ─────────────────────────────────────────────── -->
            <template v-if="tab==='phone'">
              <div class="ps-head">Phone Field</div>
              <div class="ps-row-2">
                <div class="ps-field"><label>Country Flag</label><input v-model="f.country_flag" class="inp" style="font-size:22px;text-align:center" placeholder="🇦🇪"/></div>
                <div class="ps-field"><label>Dial Code</label><input v-model="f.country_code" class="inp" type="text" placeholder="+971"/></div>
              </div>
              <div class="iti-demo-preview">
                <div class="iti-flag-box">{{ f.country_flag || '🇦🇪' }} <span>{{ f.country_code || '+971' }}</span> ▾</div>
                <div class="iti-number-box">50 123 4567</div>
              </div>
              <p class="hint" style="margin-top:8px">In the live widget, intl-tel-input auto-detects the visitor's country.</p>
            </template>

            <!-- ── FIELDS ─────────────────────────────────────────────── -->
            <template v-if="tab==='fields'">
              <div class="ps-head">Drag &amp; Drop Form Fields</div>
              <p class="hint" style="margin-bottom:16px">Drag items to rearrange the form fields order. Toggle switches to enable or disable optional fields.</p>
              
              <div class="drag-list">
                <div 
                  v-for="(field, index) in fieldsList" 
                  :key="field.id" 
                  class="drag-item"
                  draggable="true"
                  @dragstart="dragStart(index)"
                  @dragover.prevent
                  @drop="dragDrop(index)"
                >
                  <div class="drag-handle">☰</div>
                  <div class="drag-info">
                    <strong>{{ field.label }}</strong>
                    <span v-if="field.id === 'first_name' || field.id === 'phone'" class="req-badge">Required</span>
                    <span v-else class="opt-badge">Optional</span>
                  </div>
                  <div class="drag-action">
                    <label v-if="field.id === 'last_name'" class="sw">
                      <input type="checkbox" v-model="f.require_lastname"/>
                      <span class="sw-t"></span>
                    </label>
                    <label v-if="field.id === 'email'" class="sw">
                      <input type="checkbox" v-model="f.require_email"/>
                      <span class="sw-t"></span>
                    </label>
                  </div>
                </div>
              </div>
            </template>

            <!-- ── AGENTS ─────────────────────────────────────────────── -->
            <template v-if="tab==='agents'">
              <div class="ps-head">Agent Display</div>
              <div class="toggle-row">
                <div class="tr-info"><strong>Show Agent Profile</strong><span>Display agent name & photo above the form</span></div>
                <label class="sw"><input type="checkbox" v-model="f.show_agent"/><span class="sw-t"></span></label>
              </div>
              <div v-if="f.show_agent">
                <div class="ps-field" style="margin-top:14px">
                  <label>Avatar Shape</label>
                  <div class="avatar-shape-opts">
                    <div v-for="sh in avatarShapes" :key="sh.val" :class="['av-opt', {active: f.avatar_shape===sh.val}]" @click="f.avatar_shape=sh.val">
                      <div class="av-demo" :style="{borderRadius: sh.radius, background: f.color_primary}">
                        <img src="https://ui-avatars.com/api/?name=John&background=transparent&color=fff&size=64" style="width:100%;height:100%;object-fit:cover;"/>
                      </div>
                      <span>{{ sh.label }}</span>
                    </div>
                  </div>
                </div>
                <div class="ps-field">
                  <label>Avatar Border Color</label>
                  <div class="cp-wrap">
                    <div class="cp-swatch" :style="{background: f.avatar_border_color}" @click="$refs.cpAvatar.click()">
                      <input ref="cpAvatar" type="color" :value="f.avatar_border_color" @input="e=>f.avatar_border_color=e.target.value" class="cp-native"/>
                    </div>
                    <input class="cp-hex" :value="f.avatar_border_color" @change="e=>{ if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) f.avatar_border_color=e.target.value }" maxlength="7"/>
                  </div>
                </div>
                <div class="ps-field">
                  <label>Agent Status Label</label>
                  <input v-model="f.agent_status_text" class="inp" type="text" placeholder="Will answer your call"/>
                </div>
                <div class="ps-field" style="margin: 10px 0;">
                  <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-weight: 600;">
                    <input type="checkbox" v-model="f.agent_rotation_enabled" style="width: 16px; height: 16px; accent-color: var(--primary);" />
                    <span>Enable 15-second Agent Rotation</span>
                  </label>
                  <span class="hint" style="margin-left: 24px; margin-top: 4px; display: block;">When enabled, the widget cycles through all active agents every 15 seconds. If disabled, a random agent is loaded statically.</span>
                </div>
                <div class="ps-field" v-if="f.theme_style === 'split'">
                  <label>Agent Panel Background Image URL <span class="opt-tag">optional</span></label>
                  <input v-model="f.agent_bg_url" class="inp" type="url" placeholder="https://example.com/bg.jpg"/>
                  <span class="hint">Applies a premium background image to the agent column.</span>
                </div>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head" style="display:flex;align-items:center;justify-content:space-between">
                Agents on this Widget
                <button class="btn btn-ghost btn-sm" @click="openAddAgent">+ Add</button>
              </div>
              <div v-if="!widget?.Agents?.length" class="empty-agents">No agents — calls go to fallback queue.</div>
              <div v-else class="agent-list">
                <div v-for="ag in widget.Agents" :key="ag.id" class="agent-row">
                  <img :src="ag.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(ag.first_name)}&background=1f6feb&color=fff&size=64`" class="ag-av"/>
                  <div class="ag-info"><strong>{{ ag.first_name }} {{ ag.last_name || '' }}</strong><span>Ext {{ ag.extension }}</span></div>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-ghost btn-sm" @click="editAgent(ag)">Edit</button>
                    <button class="btn btn-danger btn-sm" @click="removeAgent(ag.id)">✕</button>
                  </div>
                </div>
              </div>

              <!-- Add Agent Modal -->
              <teleport to="body">
                <transition name="fade">
                  <div v-if="showAddAgent" class="mbd" @click.self="showAddAgent=false">
                    <div class="mbx card">
                      <div class="mbx-h"><h3>{{ editingAgentId ? 'Edit Agent' : 'Add Agent' }}</h3><button class="btn btn-icon btn-ghost" @click="showAddAgent=false">✕</button></div>
                      <div class="mbx-b">
                        <div class="ps-row-2">
                          <div class="ps-field"><label>First Name *</label><input v-model="agForm.first_name" class="inp" placeholder="John"/></div>
                          <div class="ps-field"><label>Last Name</label><input v-model="agForm.last_name" class="inp" placeholder="Doe"/></div>
                        </div>
                        <div class="ps-field"><label>Extension *</label><input v-model="agForm.extension" class="inp" placeholder="101"/></div>
                        <div class="ps-field">
                          <label>Avatar URL <span class="opt-tag">optional</span></label>
                          <input v-model="agForm.avatar_url" class="inp" type="url" placeholder="https://…"/>
                        </div>
                        <div v-if="agForm.first_name" class="ag-preview-row">
                          <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(agForm.first_name)}&background=1f6feb&color=fff&size=64`" class="ag-av"/>
                          <span style="color:var(--text2);font-size:12px">Auto-generated avatar</span>
                        </div>
                      </div>
                      <div class="mbx-f">
                        <button class="btn btn-ghost" @click="showAddAgent=false">Cancel</button>
                        <button class="btn btn-primary" :disabled="addingAgent" @click="addAgent">{{ addingAgent ? 'Saving…' : (editingAgentId ? 'Save Changes' : 'Add Agent') }}</button>
                      </div>
                    </div>
                  </div>
                </transition>
              </teleport>
            </template>

            <!-- ── CONNECTION ────────────────────────────────────────────── -->
            <template v-if="tab==='connection'">
              <div class="ps-head">3CX API Connection</div>
              <p class="hint" style="margin-bottom:14px">
                Enter your 3CX server OAuth credentials. These are generated in
                <strong>Management Console → Users → Administrators → (API user)</strong>.
              </p>

              <div class="ps-field">
                <label>3CX Server URL (FQDN)</label>
                <input
                  v-model="cf.fqdn_3cx"
                  class="inp"
                  placeholder="ebmsdxb.3cx.ae:3081"
                  @blur="cf.fqdn_3cx = cf.fqdn_3cx.replace(/^https?:\/\//i,'').replace(/\/$/,'')"
                />
                <span class="hint">Host and port only — no https://  e.g. <code style="font-size:11px">ebmsdxb.3cx.ae:3081</code></span>
              </div>

              <div class="ps-field">
                <label>Client ID</label>
                <input v-model="cf.client_id_3cx" class="inp" placeholder="your-client-id"/>
                <span class="hint">Application ID from the 3CX API / Integrations panel</span>
              </div>

              <div class="ps-field">
                <label>Client Secret</label>
                <div style="position:relative">
                  <input
                    :type="showSecret ? 'text' : 'password'"
                    v-model="cf.client_secret_3cx"
                    class="inp"
                    placeholder="••••••••••••"
                    style="padding-right:40px"
                  />
                  <button
                    type="button"
                    @click="showSecret=!showSecret"
                    style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:15px;padding:0"
                    :title="showSecret ? 'Hide' : 'Show'"
                  >{{ showSecret ? '🙈' : '👁️' }}</button>
                </div>
              </div>

              <div class="ps-field">
                <label>Grant Type</label>
                <select v-model="cf.grant_type_3cx" class="sel">
                  <option value="client_credentials">client_credentials (server-to-server)</option>
                </select>
              </div>

              <div class="ps-field">
                <label>Fallback Extension / Queue <span class="opt-tag">optional</span></label>
                <input v-model="cf.agent_extension_3cx" class="inp" placeholder="800"/>
                <span class="hint">Used if no agent is assigned to this widget</span>
              </div>

              <!-- Test Connection -->
              <div style="margin-top:18px">
                <button
                  class="btn btn-ghost"
                  :disabled="testingConn"
                  @click="testConnection"
                  style="width:100%;justify-content:center"
                >
                  <span v-if="testingConn">⏳ Testing…</span>
                  <span v-else>🔌 Test Connection</span>
                </button>
                <div v-if="testResult" :class="['conn-result', testResult.ok ? 'ok' : 'err']">
                  <span>{{ testResult.ok ? '✅' : '❌' }} {{ testResult.message }}</span>
                  <div v-if="testResult.ok && testResult.extensions?.length" class="ext-chips">
                    <span v-for="e in testResult.extensions.slice(0,12)" :key="e" class="ext-chip">{{ e }}</span>
                    <span v-if="testResult.extensions.length > 12" class="ext-chip" style="opacity:.6">+{{ testResult.extensions.length - 12 }} more</span>
                  </div>
                </div>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Webhook Settings</div>
              <div class="ps-field">
                <label>n8n / GHL Webhook URL (Global) <span class="opt-tag">optional</span></label>
                <input v-model="cf.webhook_url_n8n" class="inp" type="url" placeholder="https://…"/>
                <span class="hint">POST request sent on every status update/change</span>
              </div>

              <div class="ps-field">
                <label>Call Dialing / Initiated Webhook <span class="opt-tag">optional</span></label>
                <input v-model="cf.webhook_initiated" class="inp" type="url" placeholder="https://…"/>
                <span class="hint">POST request sent when the call starts dialing/ringing</span>
              </div>

              <div class="ps-field">
                <label>Call Answered Webhook <span class="opt-tag">optional</span></label>
                <input v-model="cf.webhook_answered" class="inp" type="url" placeholder="https://…"/>
                <span class="hint">POST request sent when the agent answers the call</span>
              </div>

              <div class="ps-field">
                <label>Call Completed Webhook <span class="opt-tag">optional</span></label>
                <input v-model="cf.webhook_completed" class="inp" type="url" placeholder="https://…"/>
                <span class="hint">POST request sent when call connects and finishes talking successfully</span>
              </div>

              <div class="ps-field">
                <label>Call Failed / Busy Webhook <span class="opt-tag">optional</span></label>
                <input v-model="cf.webhook_failed" class="inp" type="url" placeholder="https://…"/>
                <span class="hint">POST request sent if the call goes unanswered, busy, or fails</span>
              </div>

              <div class="ps-field">
                <label>Offline Lead Webhook <span class="opt-tag">optional</span></label>
                <input v-model="cf.webhook_lead" class="inp" type="url" placeholder="https://…"/>
                <span class="hint">POST request sent when an offline lead form is submitted</span>
              </div>
            </template>

            <!-- ── OFFICE HOURS ────────────────────────────────────────── -->
            <template v-if="tab==='office_hours'">
              <div class="ps-head">Office Hours Scheduler</div>
              <p class="hint" style="margin-bottom:14px">
                Set your business hours. When outside office hours, the widget operates as an offline lead generation form instead of triggering live phone calls.
              </p>

              <div class="ps-field-check">
                <input type="checkbox" id="oh-enabled" v-model="f.office_hours_enabled" />
                <label for="oh-enabled" style="font-weight:600;margin-left:6px;cursor:pointer">Enable Office Hours limits</label>
              </div>

              <div v-if="f.office_hours_enabled" style="margin-top:16px">
                <div class="ps-row-2">
                  <div class="ps-field">
                    <label>Start Time</label>
                    <input type="time" v-model="f.office_hours_start" class="inp" />
                  </div>
                  <div class="ps-field">
                    <label>End Time</label>
                    <input type="time" v-model="f.office_hours_end" class="inp" />
                  </div>
                </div>

                <div class="ps-field">
                  <label>Business Days</label>
                  <div class="days-picker">
                    <label class="day-opt" v-for="d in [
                      { val: '1', label: 'Mon' },
                      { val: '2', label: 'Tue' },
                      { val: '3', label: 'Wed' },
                      { val: '4', label: 'Thu' },
                      { val: '5', label: 'Fri' },
                      { val: '6', label: 'Sat' },
                      { val: '0', label: 'Sun' }
                    ]" :key="d.val">
                      <input type="checkbox" :value="d.val" :checked="isDayChecked(d.val)" @change="toggleDay(d.val)" />
                      <span style="margin-left:4px">{{ d.label }}</span>
                    </label>
                  </div>
                </div>

                <div class="ps-field">
                  <label>Timezone</label>
                  <select v-model="f.office_hours_timezone" class="sel">
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                    <option value="UTC">UTC / GMT</option>
                  </select>
                </div>

                <div class="ps-field">
                  <label>Agent Ring Timeout (seconds)</label>
                  <input type="number" v-model.number="f.ring_timeout_seconds" class="inp" min="10" max="180" placeholder="40" />
                  <span class="hint">How long each agent extension rings before retrying the next available agent (default is 40s).</span>
                </div>


                <div class="ps-divider"></div>
                <div class="ps-head" style="margin-top:12px">Offline Text Customization</div>

                <div class="ps-field">
                  <label>Offline Headline</label>
                  <input v-model="f.office_hours_out_title" class="inp" placeholder="Office Closed" />
                </div>

                <div class="ps-field">
                  <label>Offline Form Subtitle</label>
                  <textarea v-model="f.office_hours_out_subtitle" class="inp textarea" rows="2" placeholder="We are currently offline..."></textarea>
                </div>

                <div class="ps-field">
                  <label>Offline Success Message</label>
                  <textarea v-model="f.office_hours_out_msg" class="inp textarea" rows="2" placeholder="Leave your details and we will call you back shortly."></textarea>
                </div>

                <div class="ps-divider"></div>
                <div class="ps-head" style="margin-top:12px">Offline Left Panel Customization</div>

                <div class="ps-field">
                  <label>Offline Status Title</label>
                  <input v-model="f.office_hours_out_status" class="inp" placeholder="We're Offline" />
                </div>

                <div class="ps-field">
                  <label>Offline Status Subtext</label>
                  <textarea v-model="f.office_hours_out_sub" class="inp textarea" rows="2" placeholder="Leave a message and we'll reply during business hours!"></textarea>
                </div>
              </div>
            </template>


            <!-- ── ADVANCED ───────────────────────────────────────────── -->
            <template v-if="tab==='advanced'">
              <div class="ps-head">Animations</div>
              <div class="ps-field" style="margin-top:10px">
                <label>FAB Animation Style</label>
                <select v-model="f.animation_style" class="sel">
                  <option value="pulse">Pulse effect</option>
                  <option value="bounce">Bounce effect</option>
                  <option value="spin">Spin rotation</option>
                  <option value="none">No animation</option>
                </select>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Backdrop overlay</div>
              <div class="ps-field" style="margin-top:10px">
                <label>Overlay background blur</label>
                <div class="slider-wrap">
                  <input type="range" min="0" max="16" v-model.number="f.overlay_blur" class="slider"/>
                  <span class="slider-val">{{ f.overlay_blur }}px</span>
                </div>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Branding</div>
              <div class="toggle-row" style="margin-top:10px">
                <div class="tr-info"><strong>Show Footer Branding</strong><span>Display white-labeled branding at the bottom</span></div>
                <label class="sw"><input type="checkbox" v-model="f.show_branding"/><span class="sw-t"></span></label>
              </div>
              <div v-if="f.show_branding" style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
                <div class="ps-field">
                  <label>Branding Text</label>
                  <input v-model="f.branding_text" class="inp" type="text" placeholder="Powered by 3CX Widget"/>
                </div>
                <div class="ps-field">
                  <label>Branding Link URL</label>
                  <input v-model="f.branding_url" class="inp" type="url" placeholder="https://3cx.com"/>
                </div>
              </div>

              <div class="ps-divider"></div>
              <div class="ps-head">Developer styling</div>
              <div class="ps-field" style="margin-top:10px">
                <label>Custom CSS Overrides</label>
                <textarea v-model="f.custom_css" class="inp textarea" rows="8" placeholder="#cx-widget-button { border: 2px solid red; }"></textarea>
                <span class="hint">Write standard CSS rules to override widget styles directly.</span>
              </div>
            </template>

          </div>
        </aside>

        <!-- ══ LIVE PREVIEW ══════════════════════════════════════════════ -->
        <section class="bldr-preview">
          <div class="prev-top">
            <span class="live-pill">● Live Preview</span>
            <button class="tiny" @click="resetPrev">↺ Reset</button>
          </div>

          <!-- Browser frame -->
          <div class="browser-frame" :class="device" :style="{ '--primary': f.color_primary, '--btn-color': f.color_button_text }">
            <div class="bfr-bar">
              <div class="bfr-dots"><span></span><span></span><span></span></div>
              <div class="bfr-url">yourwebsite.com</div>
              <div style="width:60px"></div>
            </div>
            <div class="bfr-body" :style="popupWrapStyle">
              <!-- Dynamically injected custom CSS scoped to the preview -->
              <style v-if="scopedCustomCss" v-html="scopedCustomCss"></style>

              <!-- Fake page -->
              <div class="fp">
                <div class="fp-nav"></div>
                <div class="fp-hero">
                  <div class="fp-h1"></div>
                  <div class="fp-p"></div>
                  <div class="fp-p" style="width:70%"></div>
                  <div class="fp-btn"></div>
                </div>
              </div>

              <!-- ── Centered popup style ── -->
              <template v-if="f.popup_style==='center'">
                <transition name="mfade">
                  <div v-if="modalOpen" class="c-overlay" @click.self="closeModal">
                    <div id="cx-modal" :class="['c-popup', 'cx-theme-' + f.theme_style]" :style="popupInlineStyle">
                      <button class="c-close" :style="{color: f.color_button_text, background: 'rgba(0,0,0,0.15)'}" @click="closeModal">✕</button>
                      <div v-if="f.logo_url && f.theme_style !== 'split' && f.theme_style !== 'floating'" class="pw-logo" @click="tab = 'design'"><img :src="f.logo_url" alt="logo" :style="{ maxHeight: f.logo_height ? f.logo_height + 'px' : '36px', maxWidth: f.logo_width ? f.logo_width + 'px' : 'auto', objectFit: 'contain' }" @error="e=>e.target.style.display='none'"/></div>
                      <ModalContents :f="f" :success="callSuccess" :isClosedPreview="isClosedPreview" :tab="tab" @submit="callSuccess=true" @back="callSuccess=false" @close="closeModal" @select-tab="tab = $event"/>
                    </div>
                  </div>
                </transition>
              </template>

              <!-- ── Corner popup style ── -->
              <template v-else>
                <div :class="['w-corner', f.position || 'bottom-right', 'cx-fab-' + f.animation_style]">
                  <transition name="tooltip-t">
                    <div v-if="showTooltip && !modalOpen" :class="['w-tip', 'el-editable-tooltip', 'cx-tooltip-' + f.tooltip_style]" @click.stop="tab = 'text'" :style="{ '--primary': f.color_primary, '--btn-color': f.color_button_text }">
                      <button class="w-tip-x" @click.stop="showTooltip=false">✕</button>
                      <span
                        contenteditable="true"
                        @blur="e => f.tooltip_text = e.target.innerText.trim()"
                        @keydown.enter.prevent="e => e.target.blur()"
                        title="Click to edit tooltip inline"
                      >{{ f.tooltip_text || 'Click here — we will call you in 55 seconds!' }}</span>
                      <div class="w-tip-arrow"></div>
                    </div>
                  </transition>

                  <transition name="mfade">
                    <div v-if="modalOpen" id="cx-modal" :class="['w-popup', 'cx-theme-' + f.theme_style]" :style="popupInlineStyle">
                      <div v-if="f.logo_url && f.theme_style !== 'split' && f.theme_style !== 'floating'" class="pw-logo-corner" @click="tab = 'design'"><img :src="f.logo_url" alt="logo" :style="{ maxHeight: f.logo_height ? f.logo_height + 'px' : '36px', maxWidth: f.logo_width ? f.logo_width + 'px' : 'auto', objectFit: 'contain' }" @error="e=>e.target.style.display='none'"/></div>
                      <ModalContents :f="f" :success="callSuccess" :isClosedPreview="isClosedPreview" :tab="tab" @submit="callSuccess=true" @back="callSuccess=false" @close="closeModal" @select-tab="tab = $event"/>
                    </div>
                  </transition>

                  <button id="cx-widget-button" class="w-fab" :style="fabStyle" @click="openModal">
                    <svg viewBox="0 0 24 24" :fill="f.color_button_text" :width="f.btn_size*0.43" :height="f.btn_size*0.43"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                  </button>
                </div>
              </template>

              <!-- center-mode trigger button -->
              <template v-if="f.popup_style==='center'">
                <div :class="['w-corner', 'bottom-right', 'cx-fab-' + f.animation_style]">
                  <button id="cx-widget-button" class="w-fab" :style="fabStyle" @click="openModal">
                    <svg viewBox="0 0 24 24" :fill="f.color_button_text" :width="f.btn_size*0.43" :height="f.btn_size*0.43"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                  </button>
                </div>
              </template>

            </div>
          </div>
          <p class="prev-note">Click the 📞 button to interact with the widget</p>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import ModalContents from '../components/ModalContents.vue'
import { useWidgetStore } from '../stores'

const route = useRoute()
const store  = useWidgetStore()
const toast  = inject('toast')

const widget      = ref(null)
const saving      = ref(false)
const tab         = ref('design')
const device      = ref('desktop')
const modalOpen   = ref(false)
const showTooltip = ref(true)
const callSuccess = ref(false)
// Agent Management
const showAddAgent = ref(false)
const addingAgent = ref(false)
const editingAgentId = ref(null)
const showSecret  = ref(false)
const testingConn = ref(false)
const testResult  = ref(null)

const agForm = reactive({ first_name:'', last_name:'', extension:'', avatar_url:'' })
const isClosedPreview = computed(() => f.office_hours_enabled && tab.value === 'office_hours')

const tabs = [
  { id:'design',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>', label:'Design' },
  { id:'text',         icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>', label:'Text' },
  { id:'phone',        icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>', label:'Phone' },
  { id:'fields',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>', label:'Fields' },
  { id:'agents',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', label:'Agents' },
  { id:'office_hours', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>', label:'Hours' },
  { id:'connection',   icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', label:'Connect' },
  { id:'advanced',     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>', label:'Advanced' },
]

const palettes   = ['#0b4526','#1f6feb','#7c3aed','#dc2626','#ea580c','#0891b2','#059669','#111827']
const fonts      = ['Inter','Roboto','Open Sans','Poppins','DM Sans','Lato','Nunito','Outfit']
const positions  = [
  { val:'bottom-right', icon:'↘', label:'Bottom Right' },
  { val:'bottom-left',  icon:'↙', label:'Bottom Left'  },
  { val:'top-right',    icon:'↗', label:'Top Right'     },
  { val:'top-left',     icon:'↖', label:'Top Left'      },
]
const popupStyles = [
  { val:'corner', label:'Corner Popup',   css:'border-radius:10px 10px 0 10px;width:36px;height:36px;background:#e5e7eb;' },
  { val:'center', label:'Center Modal',   css:'border-radius:10px;width:44px;height:32px;background:#e5e7eb;margin:0 auto;' },
]
const avatarShapes = [
  { val:'circle',  label:'Circle',  radius:'50%' },
  { val:'rounded', label:'Rounded', radius:'10px' },
  { val:'square',  label:'Square',  radius:'0' },
]
const fabDesigns = [
  { val: 'classic', label: 'Classic Circle' },
  { val: 'squircle', label: 'Squircle Shape' },
  { val: 'pill', label: 'Pill Tab ("Call Us")' },
  { val: 'dock', label: 'Bottom Dock Tab' },
  { val: 'glow', label: 'Glow Pulsing Circle' },
  { val: 'double-ring', label: 'Double Wave Rings' },
  { val: 'glass', label: 'Glassmorphic Bubble' },
  { val: 'minimal', label: 'Minimalist Dot' },
  { val: 'left-tab', label: 'Left Side Tab' },
  { val: 'right-tab', label: 'Right Side Tab' },
]
const tooltipStyles = [
  { val: 'classic', label: 'Classic Cloud' },
  { val: 'glass', label: 'Glassmorphic' },
  { val: 'solid', label: 'Solid Color' },
  { val: 'dark', label: 'Dark Mode' },
  { val: 'neon', label: 'Neon Glow' },
  { val: 'gradient', label: 'Colorful Gradient' },
  { val: 'border', label: 'Outlined Border' },
  { val: 'shadow', label: 'Deep Shadow' },
  { val: 'minimal', label: 'Minimalist' },
  { val: 'bubble', label: 'Playful Bubble' },
]
const themeStyles = [
  { val: 'classic',    label: '🏷️ Classic Banner' },
  { val: 'modern',    label: '✨ Modern Rounded' },
  { val: 'compact',   label: '💬 Compact Bubble' },
  { val: 'split',     label: '📐 Split-Panel' },
  { val: 'neon',      label: '⚡ Futuristic Neon' },
  { val: 'glass',     label: '🪟 Glassmorphism' },
  { val: 'dark',      label: '🌑 Dark Elegance' },
  { val: 'wave',      label: '🌊 Gradient Wave' },
  { val: 'floating',  label: '🃏 Floating Card' },
  { val: 'corporate', label: '🏢 Corporate Pro' },
]

const successIconsList = [
  { val: '&#x2705;', label: 'Green Check Emoji' },
  { val: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>', label: 'Solid Check' },
  { val: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', label: 'Outline Check' },
  { val: '🎉', label: 'Party Popper' },
  { val: '👍', label: 'Thumbs Up' },
  { val: '🏆', label: 'Trophy' },
]

const failedIconsList = [
  { val: '&#x274C;', label: 'Red Cross Emoji' },
  { val: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>', label: 'Solid Cross' },
  { val: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>', label: 'Outline Cross' },
  { val: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>', label: 'Warning Alert' },
  { val: '😢', label: 'Sad Face' },
  { val: '✋', label: 'Stop Hand' },
]

const f = reactive({
  color_primary:'#0b4526', color_button_text:'#ffffff',
  widget_title:'', widget_subtitle:'', widget_button_text:'', widget_success_title:'', widget_success_msg:'',
  tooltip_text:'', country_code:'+971', country_flag:'🇦🇪',
  tooltip_autohide: true, tooltip_autohide_seconds: 15,
  require_email:true, require_lastname:true,
  logo_url:'', position:'bottom-right', popup_style:'corner', tooltip_style:'classic',
  border_radius:16, btn_size:60, font_family:'Inter',
  show_agent:true, avatar_shape:'circle', avatar_border_color:'', agent_status_text:'Will answer your call',
  fields_order:'first_name,last_name,email,phone',
  animation_style:'pulse', overlay_blur:3, custom_css:'', show_branding:true,
  branding_text:'Powered by 3CX Widget', branding_url:'https://3cx.com',
  theme_style:'classic',
  agent_bg_url:'',
  widget_width: 345,
  widget_height: null,
  logo_height: 36,
  logo_width: 140,
  icon_success_html: '&#x2705;',
  icon_failed_html: '&#x274C;',
  icon_success_style: 'color: __PRIMARY__; font-size: 52px; display: block; margin-bottom: 10px;',
  icon_failed_style: 'color: #ef4444; font-size: 52px; display: block; margin-bottom: 10px;',
  // Office hours defaults
  office_hours_enabled:  false,
  office_hours_start:    '09:00',
  office_hours_end:      '18:00',
  office_hours_timezone: 'Asia/Dubai',
  office_hours_days:     '1,2,3,4,5',
  office_hours_out_title:'Office Closed',
  office_hours_out_subtitle:'We are currently offline. Please leave your details below and we will contact you during business hours!',
  office_hours_out_msg:  'We have received your inquiry. You will be contacted shortly during business hours!',
  office_hours_out_status:"We're Offline",
  office_hours_out_sub:  "Leave a message and we'll reply during business hours!",
  ring_timeout_seconds:  40,
  agent_rotation_enabled:true,
})

const unifiedIconSize = computed({
  get() {
    const match = f.icon_success_style?.match(/font-size:\s*(\d+)px/);
    return match ? parseInt(match[1]) : 52;
  },
  set(val) {
    let sStyle = f.icon_success_style || 'display: block; margin-bottom: 10px; color: __PRIMARY__;';
    if (/font-size:\s*\d+px/.test(sStyle)) sStyle = sStyle.replace(/font-size:\s*\d+px/, `font-size: ${val}px`);
    else sStyle += ` font-size: ${val}px;`;
    f.icon_success_style = sStyle;

    let fStyle = f.icon_failed_style || 'display: block; margin-bottom: 10px; color: #ef4444;';
    if (/font-size:\s*\d+px/.test(fStyle)) fStyle = fStyle.replace(/font-size:\s*\d+px/, `font-size: ${val}px`);
    else fStyle += ` font-size: ${val}px;`;
    f.icon_failed_style = fStyle;
  }
});

const cf = reactive({
  fqdn_3cx: '',
  client_id_3cx: '',
  client_secret_3cx: '',
  grant_type_3cx: 'client_credentials',
  agent_extension_3cx: '',
  webhook_url_n8n: '',
  webhook_initiated: '',
  webhook_answered: '',
  webhook_completed: '',
  webhook_failed: '',
  webhook_lead: ''
})

// Drag and drop form fields reordering state
const fieldsList = ref([
  { id: 'first_name', label: 'First Name' },
  { id: 'last_name', label: 'Last Name' },
  { id: 'email', label: 'Email Address' },
  { id: 'phone', label: 'Phone Number' },
])

let dragIdx = null
function dragStart(idx) {
  dragIdx = idx
}
function dragDrop(idx) {
  if (dragIdx === null) return
  const item = fieldsList.value.splice(dragIdx, 1)[0]
  fieldsList.value.splice(idx, 0, item)
  dragIdx = null
  // Sync back order to reactive fields_order property
  f.fields_order = fieldsList.value.map(x => x.id).join(',')
}

onMounted(async () => {
  if (!store.widgets.length) await store.fetch()
  const w = store.getById(route.params.id)
  if (w) {
    widget.value = w
    const fields = ['color_primary','color_button_text','widget_title','widget_subtitle','widget_button_text',
      'widget_success_title','widget_success_msg','tooltip_text','country_code','country_flag',
      'require_email','require_lastname','logo_url','position','popup_style','border_radius','btn_size',
      'font_family','show_agent','avatar_shape','avatar_border_color','agent_status_text','fields_order',
      'animation_style','overlay_blur','custom_css','show_branding','branding_text','branding_url',
      'theme_style','agent_bg_url','widget_width','widget_height',
      'logo_height','logo_width','icon_success_html','icon_failed_html','icon_success_style','icon_failed_style',
      'office_hours_enabled','office_hours_start','office_hours_end','office_hours_timezone',
      'office_hours_days','office_hours_out_title','office_hours_out_subtitle','office_hours_out_msg',
      'office_hours_out_status','office_hours_out_sub','ring_timeout_seconds','agent_rotation_enabled',
      'tooltip_autohide','tooltip_autohide_seconds']
    fields.forEach(k => { if (w[k] !== undefined && w[k] !== null) f[k] = w[k] })
    Object.assign(cf, {
      fqdn_3cx:           w.fqdn_3cx            || '',
      client_id_3cx:      w.client_id_3cx       || '',
      client_secret_3cx:  w.client_secret_3cx   || '',
      grant_type_3cx:     w.grant_type_3cx      || 'client_credentials',
      agent_extension_3cx:w.agent_extension_3cx || '',
      webhook_url_n8n:    w.webhook_url_n8n     || '',
      webhook_initiated:  w.webhook_initiated   || '',
      webhook_answered:   w.webhook_answered    || '',
      webhook_completed:  w.webhook_completed   || '',
      webhook_failed:     w.webhook_failed      || '',
      webhook_lead:       w.webhook_lead        || '',
    })

    // Restore sorted fields list order
    if (f.fields_order) {
      const order = f.fields_order.split(',')
      const sorted = []
      order.forEach(id => {
        const item = fieldsList.value.find(x => x.id === id)
        if (item) sorted.push(item)
      })
      fieldsList.value.forEach(item => {
        if (!sorted.includes(item)) sorted.push(item)
      })
      fieldsList.value = sorted
    }
  }
})

function openModal()  { modalOpen.value = true;  showTooltip.value = false }
function closeModal() { modalOpen.value = false; callSuccess.value = false }
function resetPrev()  { modalOpen.value = false; showTooltip.value = true; callSuccess.value = false }

function isDayChecked(val) {
  const days = (f.office_hours_days || '').split(',').map(x => x.trim());
  return days.includes(val);
}

function toggleDay(val) {
  let days = (f.office_hours_days || '').split(',').map(x => x.trim()).filter(Boolean);
  if (days.includes(val)) {
    days = days.filter(x => x !== val);
  } else {
    days.push(val);
  }
  f.office_hours_days = days.join(',');
}


async function testConnection() {
  testResult.value  = null
  testingConn.value = true
  try {
    const token = localStorage.getItem('admin_token')
    const resp  = await fetch(`/api/admin/widgets/${widget.value.id}/test-connection`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        fqdn_3cx:           cf.fqdn_3cx,
        client_id_3cx:      cf.client_id_3cx,
        client_secret_3cx:  cf.client_secret_3cx,
        grant_type_3cx:     cf.grant_type_3cx,
      }),
    })
    const data = await resp.json()
    if (data.ok) {
      testResult.value = {
        ok:         true,
        message:    `Connected! Found ${data.extensionCount} extension(s) on this 3CX server.`,
        extensions: data.extensions,
      }
    } else {
      testResult.value = { ok: false, message: data.error || 'Connection failed' }
    }
  } catch (e) {
    testResult.value = { ok: false, message: e.message }
  } finally {
    testingConn.value = false
  }
}

const popupInlineStyle = computed(() => {
  const styles = {
    borderRadius: f.border_radius + 'px',
    fontFamily: f.font_family + ', sans-serif',
  }
  if (f.theme_style === 'split') {
    styles.width = (f.widget_width || 460) + 'px'
  } else if (f.theme_style === 'compact') {
    styles.width = '220px'
  } else {
    styles.width = (f.widget_width || 345) + 'px'
  }
  
  if (f.widget_height) {
    styles.height = f.widget_height + 'px'
    styles.minHeight = '0px'
  } else {
    styles.height = 'auto'
    if (f.theme_style === 'split') {
      styles.minHeight = '310px'
    } else {
      styles.minHeight = 'auto'
    }
  }
  return styles
})

const fabStyle = computed(() => ({
  width:  f.btn_size + 'px',
  height: f.btn_size + 'px',
  background: f.color_primary,
  borderRadius: '50%',
}))

const popupWrapStyle = computed(() => f.popup_style === 'center' ? { position:'relative' } : {})

const scopedCustomCss = computed(() => {
  if (!f.custom_css) return ''
  return f.custom_css.replace(/([^\r\n,{}]+)(?=\s*{[^{}]*})/g, (match) => {
    if (match.includes('@') || match.trim().startsWith('to') || match.trim().startsWith('from')) {
      return match
    }
    return match.split(',').map(selector => {
      const trimmed = selector.trim()
      if (!trimmed) return ''
      return `.bfr-body ${trimmed}`
    }).join(', ')
  })
})

function themePreviewStyle(val) {
  const p = f.color_primary || '#0b4526'
  const p80 = p + 'cc'
  const styles = {
    classic:    { background: p, borderBottom: `3px solid ${p}` },
    modern:     { background: `linear-gradient(160deg, #f0f4ff 0%, #e8ecf8 100%)`, borderBottom: `3px solid ${p}` },
    compact:    { background: `linear-gradient(135deg, #f9fafb, #e5e7eb)` },
    split:      { background: `linear-gradient(90deg, ${p} 42%, #f3f4f6 42%)` },
    neon:       { background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, boxShadow: `inset 0 0 18px ${p}44` },
    glass:      { background: `linear-gradient(135deg, ${p80} 0%, #7c3aedcc 100%)` },
    dark:       { background: `linear-gradient(135deg, #111827 0%, #1e293b 100%)` },
    wave:       { background: `linear-gradient(135deg, ${p} 0%, #7c3aed 100%)` },
    floating:   { background: `linear-gradient(160deg, #f8faff 0%, #eef2ff 100%)`, boxShadow: `0 4px 12px rgba(0,0,0,0.1)` },
    corporate:  { background: `linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)`, borderLeft: `4px solid ${p}` },
  }
  return styles[val] || { background: p }
}

async function save() {
  saving.value = true
  try {
    await store.update(route.params.id, { ...f, ...cf })
    widget.value = store.getById(route.params.id)
    toast('Widget saved!')
  } catch { toast('Save failed', 'error') }
  finally { saving.value = false }
}

function openAddAgent() {
  editingAgentId.value = null
  Object.assign(agForm, { first_name:'', last_name:'', extension:'', avatar_url:'' })
  showAddAgent.value = true
}

async function addAgent() {
  if (!agForm.first_name || !agForm.extension) return toast('First name and extension required', 'error')
  addingAgent.value = true
  try {
    if (editingAgentId.value) {
      await store.updateAgent(editingAgentId.value, { ...agForm })
      toast('Agent updated!')
    } else {
      await store.addAgent(route.params.id, { ...agForm })
      toast('Agent added!')
    }
    await store.fetch()
    widget.value = store.getById(route.params.id)
    showAddAgent.value = false
    editingAgentId.value = null
    Object.assign(agForm, { first_name:'', last_name:'', extension:'', avatar_url:'' })
  } catch { toast('Failed', 'error') }
  finally { addingAgent.value = false }
}

function editAgent(ag) {
  editingAgentId.value = ag.id
  Object.assign(agForm, {
    first_name: ag.first_name,
    last_name: ag.last_name || '',
    extension: ag.extension,
    avatar_url: ag.avatar_url || ''
  })
  showAddAgent.value = true
}

async function removeAgent(id) {
  if (!confirm('Remove this agent?')) return
  try {
    await store.deleteAgent(id)
    await store.fetch()
    widget.value = store.getById(route.params.id)
    toast('Agent removed')
  } catch { toast('Failed', 'error') }
}
</script>

<style scoped>
/* ── Shell ───────────────────────────────────────────────── */
.bldr{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.bldr-bar{display:flex;align-items:center;justify-content:space-between;height:65px;padding:0 18px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;gap:12px}
.bldr-bar-l{display:flex;align-items:center;gap:12px}
.back-btn{display:flex;align-items:center;gap:5px;color:var(--text2);text-decoration:none;font-size:13px;font-weight:500;transition:color .15s;white-space:nowrap}
.back-btn:hover{color:var(--text)}
.bldr-bar-sep{width:1px;height:22px;background:var(--border)}
.bldr-name{font-size:14px;font-weight:700}
.bldr-sub{font-size:11px;color:var(--text3)}
.bldr-bar-r{display:flex;align-items:center;gap:8px}
.device-toggle{display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.dev-btn{background:transparent;border:none;color:var(--text3);padding:6px 10px;cursor:pointer;transition:all .15s;display:flex;align-items:center}
.dev-btn:hover{color:var(--text2)}
.dev-btn.active{background:var(--bg4);color:var(--accent)}

.bldr-body{display:grid;grid-template-columns:84px 550px 1fr;flex:1;overflow:hidden;min-height:0}

/* ── Nav ──────────────────────────────────────────────────── */
.bldr-nav{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 0;overflow-y:auto;position:relative}
.bnav-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:64px;height:64px;border-radius:14px;border:none;background:transparent;color:var(--text3);cursor:pointer;transition:all .2s cubic-bezier(0.4, 0, 0.2, 1);font-family:inherit;position:relative}
.bnav-btn:hover{color:var(--text1);background:var(--bg3)}
.bnav-btn.active{color:var(--accent);background:linear-gradient(145deg, rgba(88,166,255,.15), rgba(88,166,255,.05));box-shadow:inset 0 1px 1px rgba(255,255,255,.1), 0 4px 10px rgba(0,0,0,.15);border:1px solid rgba(88,166,255,.2)}
.bnav-btn.active::before{content:'';position:absolute;left:-10px;top:50%;transform:translateY(-50%);height:24px;width:3px;background:var(--accent);border-radius:0 4px 4px 0;box-shadow:0 0 8px var(--accent)}
.bnav-icon{display:flex;align-items:center;justify-content:center;width:24px;height:24px}
.bnav-icon svg{width:100%;height:100%;transition:transform 0.2s}
.bnav-btn:hover .bnav-icon svg{transform:scale(1.1)}
.bnav-btn.active .bnav-icon svg{transform:scale(1.15);filter:drop-shadow(0 0 6px rgba(88,166,255,.5))}
.bnav-txt{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px}

/* ── Panel ────────────────────────────────────────────────── */
.bldr-panel{background:var(--bg2);border-right:1px solid var(--border);overflow-y:auto}
.panel-inner{padding:24px 28px 60px;display:flex;flex-direction:column;gap:20px}

.ps-head{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text1);padding-bottom:10px;border-bottom:1px solid rgba(128,128,128,0.15);margin-bottom:4px}
.ps-field{display:flex;flex-direction:column;gap:8px}
.ps-field label{font-size:12px;font-weight:600;color:var(--text2);display:flex;align-items:center}
.ps-row{display:flex;flex-direction:column;gap:12px}
.ps-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ps-divider{height:1px;background:var(--border);margin:4px 0}
.icon-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(42px, 1fr));gap:8px}
.icon-opt{height:44px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;transition:all .2s ease;box-shadow:0 1px 3px rgba(0,0,0,0.02)}
.icon-opt:hover{border-color:var(--text3);transform:translateY(-1px);box-shadow:0 4px 6px rgba(0,0,0,0.04)}
.icon-opt.active{background:var(--bg);border-color:var(--accent);box-shadow:0 0 0 2px rgba(88,166,255,.2), inset 0 0 0 1px var(--accent);color:var(--accent)}
:deep(.icon-opt svg){width:22px;height:22px}
.hint{font-size:11px;color:var(--text3);line-height:1.4}
.conn-result{margin-top:10px;padding:10px 12px;border-radius:8px;font-size:12px;line-height:1.5}
.conn-result.ok{background:rgba(5,150,105,.12);border:1px solid rgba(5,150,105,.3);color:#059669}
.conn-result.err{background:rgba(220,38,38,.1);border:1px solid rgba(220,38,38,.25);color:#dc2626}
.ext-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.ext-chip{background:var(--bg3);border:1px solid currentColor;border-radius:20px;padding:2px 8px;font-size:11px;opacity:.85}

.opt-tag{font-size:10px;background:var(--bg3);border:1px solid var(--border);color:var(--text3);padding:1px 6px;border-radius:20px;margin-left:4px;font-weight:400}
.ps-field-check{display:flex;align-items:center;margin-top:10px;cursor:pointer}
.ps-field-check input{cursor:pointer;width:16px;height:16px}
.days-picker{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.day-opt{display:flex;align-items:center;background:var(--bg3);border:1.5px solid var(--border);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;user-select:none;transition:all .15s}
.day-opt:hover{border-color:var(--text3)}
.day-opt input{margin:0;cursor:pointer}


/* Inputs */
.inp{width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:all .2s ease;box-shadow:inset 0 1px 2px rgba(0,0,0,0.02)}
.inp:hover{border-color:var(--text3)}
.inp:focus{border-color:var(--accent);background:var(--bg);box-shadow:0 0 0 3px rgba(88,166,255,.2), inset 0 1px 2px rgba(0,0,0,0.01)}
.inp::placeholder{color:var(--text3);opacity:0.7}
.textarea{resize:vertical;min-height:60px;line-height:1.5}
.sel{width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:10px;font-size:13px;outline:none;cursor:pointer;transition:all .2s ease;box-shadow:inset 0 1px 2px rgba(0,0,0,0.02);appearance:none;background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");background-repeat:no-repeat;background-position:right 12px center;background-size:16px;padding-right:36px}
.sel:hover{border-color:var(--text3)}
.sel:focus{border-color:var(--accent);background:var(--bg);box-shadow:0 0 0 3px rgba(88,166,255,.2)}

/* Color Picker */
.cp-wrap{display:flex;align-items:center;gap:10px}
.cp-swatch{width:36px;height:36px;border-radius:9px;border:2px solid rgba(128,128,128,.15);cursor:pointer;position:relative;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.1);transition:transform .15s}
.cp-swatch:hover{transform:scale(1.08)}
.cp-native{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;border:none;padding:0}
.cp-hex{width:94px;background:var(--bg);border:1.5px solid var(--border);color:var(--text);font-family:monospace;font-size:13px;padding:6px 10px;border-radius:8px;outline:none}
.cp-hex:focus{border-color:var(--accent)}
.cp-presets{display:flex;gap:5px;flex-wrap:wrap}
.cp-dot{width:19px;height:19px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .15s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.cp-dot:hover{transform:scale(1.2)}
.cp-dot.sel{border-color:var(--text);box-shadow:0 0 0 2px rgba(128,128,128,.5)}

/* Position Grid */
.pos-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pos-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px 8px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;cursor:pointer;font-size:18px;color:var(--text2);transition:all .2s ease;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.02)}
.pos-opt span{font-size:11px;font-weight:600}
.pos-opt:hover{border-color:var(--text3);transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,0.04)}
.pos-opt.active{background:var(--bg);border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 2px rgba(88,166,255,.2), inset 0 0 0 1px var(--accent)}

/* Popup style */
.style-opts{display:flex;gap:10px}
.style-opt{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all .2s ease;font-size:12px;font-weight:600;color:var(--text2);box-shadow:0 2px 4px rgba(0,0,0,0.02)}
.style-opt:hover{border-color:var(--text3);transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,0.04)}
.style-opt.active{background:var(--bg);border-color:var(--accent);color:var(--accent);box-shadow:0 0 0 2px rgba(88,166,255,.2), inset 0 0 0 1px var(--accent)}
.style-thumb{width:44px;height:30px}

/* Theme Template Grid */
.theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.theme-opt{
  display:flex;
  flex-direction:column;
  gap:0;
  border-radius:12px;
  border:2px solid var(--border);
  cursor:pointer;
  overflow:hidden;
  transition:all .2s ease;
  background:var(--bg);
}
.theme-opt:hover{border-color:var(--text2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.1)}
.theme-opt.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),0 4px 20px rgba(88,166,255,.2)}

.theme-preview-mock{
  height:64px;
  position:relative;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  border-radius:0;
  padding:6px 8px;
  gap:4px;
  justify-content:space-between;
}
.theme-mock-bar{
  height:7px;
  border-radius:3px;
  background:rgba(128,128,128,0.25);
  width:60%;
}
.theme-mock-body{
  display:flex;
  flex-direction:column;
  gap:3px;
  flex:1;
  justify-content:center;
}
.theme-mock-line{
  height:5px;
  border-radius:2px;
  background:rgba(128,128,128,0.18);
}
.theme-mock-btn{
  height:10px;
  border-radius:3px;
  width:55%;
  align-self:flex-end;
  opacity:0.85;
}

.theme-opt-name{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:7px 9px 7px;
  font-size:10px;
  font-weight:700;
  color:var(--text);
  background:var(--bg2);
  letter-spacing:.2px;
}
.theme-opt.active .theme-opt-name{
  color:var(--accent);
}
.theme-check-icon{
  color:var(--accent);
  flex-shrink:0;
}

/* Slider */
.slider-wrap{display:flex;align-items:center;gap:8px}
.slider{flex:1;accent-color:var(--accent)}
.slider-val{font-size:12px;color:var(--text2);min-width:36px;text-align:right;font-family:monospace}

/* Logo */
.logo-preview{padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center}
.logo-preview img{max-height:48px;max-width:100%;object-fit:contain}

/* ITI demo */
.iti-demo-preview{display:flex;border:1.5px solid var(--border);border-radius:8px;overflow:hidden;margin-top:4px}
.iti-flag-box{background:var(--bg);border-right:1.5px solid var(--border);padding:9px 11px;font-size:13px;display:flex;align-items:center;gap:4px;white-space:nowrap;color:var(--text2)}
.iti-flag-box span{font-size:12px}
.iti-number-box{flex:1;padding:9px 11px;font-size:13px;color:var(--text3)}

/* Toggle */
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:var(--bg);border:1px solid var(--border);border-radius:10px}
.tr-info{display:flex;flex-direction:column;gap:2px}
.tr-info strong{font-size:13px;font-weight:600}
.tr-info span{font-size:11px;color:var(--text2)}
.sw{position:relative;width:40px;height:22px;flex-shrink:0}
.sw input{opacity:0;width:0;height:0}
.sw-t{position:absolute;inset:0;background:var(--border);border-radius:11px;cursor:pointer;transition:.2s}
.sw-t::before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s}
.sw input:checked~.sw-t{background:#238636}
.sw input:checked~.sw-t::before{transform:translateX(18px)}

/* Avatar shape */
.avatar-shape-opts{display:flex;gap:10px}
.av-opt{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;opacity:.6;transition:all .15s}
.av-opt.active{opacity:1}
.av-opt span{font-size:11px;color:var(--text2);font-weight:600}
.av-demo{width:42px;height:42px;overflow:hidden}

/* Agents */
.empty-agents{font-size:12px;color:var(--text2);padding:12px;background:var(--bg);border:1px dashed var(--border);border-radius:8px}
.agent-list{display:flex;flex-direction:column;gap:7px}
.agent-row{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px}
.ag-av{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--border)}
.ag-info{flex:1;display:flex;flex-direction:column;gap:2px}
.ag-info strong{font-size:13px;font-weight:600}
.ag-info span{font-size:11px;color:var(--text2)}
.ag-preview-row{display:flex;align-items:center;gap:10px;margin-top:4px}

/* Agent add modal */
.mbd{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.mbx{width:100%;max-width:480px}
.mbx-h{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 0}
.mbx-b{padding:16px 22px;display:flex;flex-direction:column;gap:13px}
.mbx-f{display:flex;justify-content:flex-end;gap:10px;padding:0 22px 18px}

/* ── Preview ──────────────────────────────────────────────── */
.bldr-preview{display:flex;flex-direction:column;padding:16px 20px;background:#0a0d13;gap:10px;overflow:hidden;min-height:0}
.prev-top{display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.live-pill{font-size:12px;font-weight:600;color:#22c55e;display:flex;align-items:center;gap:6px}
.live-pill::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e}
.tiny{background:var(--bg3);border:1px solid var(--border);color:var(--text2);padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;transition:all .15s}
.tiny:hover{color:var(--text)}
.prev-note{font-size:11px;color:var(--text3);text-align:center;flex-shrink:0}

.browser-frame{flex:1;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;border:1px solid #2d3748;box-shadow:0 20px 60px rgba(0,0,0,.6);min-height:0;transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);}
.browser-frame.mobile{max-width:390px;margin:0 auto;align-self:flex-start;flex:none;height:100%}
.bfr-bar{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#151c2b;flex-shrink:0}
.bfr-dots{display:flex;gap:5px}
.bfr-dots span{width:9px;height:9px;border-radius:50%;background:#3d4558}
.bfr-url{background:#0f1623;border-radius:5px;padding:4px 14px;font-size:11px;color:#6b7280;min-width:140px;text-align:center}
.bfr-body{flex:1;background:#f3f4f6;position:relative;overflow:hidden;min-height:0}

/* Fake page */
.fp{pointer-events:none}
.fp-nav{height:40px;background:white;border-bottom:1px solid #e5e7eb}
.fp-hero{padding:20px;display:flex;flex-direction:column;gap:9px}
.fp-h1{height:18px;background:#d1d5db;border-radius:6px;width:55%}
.fp-p{height:10px;background:#e5e7eb;border-radius:4px}
.fp-btn{height:30px;width:90px;background:#d1d5db;border-radius:8px;margin-top:4px}

/* Widget corner */
.w-corner{position:absolute;display:flex;flex-direction:column;gap:8px;z-index:10}
.w-corner.bottom-right{bottom:14px;right:14px;align-items:flex-end}
.w-corner.bottom-left{bottom:14px;left:14px;align-items:flex-start}
.w-corner.top-right{top:50px;right:14px;align-items:flex-end}
.w-corner.top-left{top:50px;left:14px;align-items:flex-start}

.w-fab{border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(0,0,0,.3);transition:transform .2s;animation:fab-pulse 2.5s infinite}
.w-fab:hover{transform:scale(1.1);animation:none}
@keyframes fab-pulse{0%,100%{box-shadow:0 4px 18px rgba(0,0,0,.3)}50%{box-shadow:0 6px 24px rgba(0,0,0,.45)}}

.w-tip{background:white;border-radius:10px;padding:9px 26px 9px 11px;font-size:11px;max-width:180px;color:#374151;box-shadow:0 4px 16px rgba(0,0,0,.15);position:relative;line-height:1.5;word-break:break-word}
.w-tip-x{position:absolute;top:6px;right:8px;font-size:11px;color:#aaa;background:none;border:none;cursor:pointer;line-height:1}
.w-tip-arrow{position:absolute;bottom:-6px;right:16px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid white}

/* Corner popup card */
.w-popup{background:white;border-radius:14px;width:260px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.3);position:relative}

/* Center overlay */
.c-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:20}
.c-popup{background:white;width:82%;max-width:280px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);position:relative}
.c-close{position:absolute;top:8px;right:8px;z-index:5;border:none;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}

/* Logo in popup */
.pw-logo{padding:10px 14px 0;display:flex;align-items:center;justify-content:center;background:white}
.pw-logo img{max-height:32px;max-width:110px;object-fit:contain}
.pw-logo-corner{padding:10px 14px 0;background:white;display:flex;align-items:center;justify-content:center}
.pw-logo-corner img{max-height:28px;max-width:100px;object-fit:contain}

/* Transitions */
.tooltip-t-enter-active,.tooltip-t-leave-active{transition:all .25s}
.tooltip-t-enter-from,.tooltip-t-leave-to{opacity:0;transform:translateY(6px)}
.mfade-enter-active,.mfade-leave-active{transition:all .25s}
.mfade-enter-from,.mfade-leave-to{opacity:0;transform:scale(0.96)}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}

/* Elementor inline editable tooltip */
.el-editable-tooltip {
  border: 1px dashed transparent !important;
  cursor: pointer !important;
  transition: border-color 0.15s;
}
.el-editable-tooltip:hover {
  border-color: #388bfd !important;
}
.el-editable-tooltip span {
  outline: none;
  cursor: text;
}
.pw-logo, .pw-logo-corner {
  cursor: pointer;
  transition: opacity 0.15s;
}
.pw-logo:hover, .pw-logo-corner:hover {
  opacity: 0.8;
  outline: 1.5px dashed #388bfd;
}

/* Drag and Drop Form Fields styling */
.drag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.drag-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 9px;
  cursor: grab;
  transition: transform 0.15s, border-color 0.15s;
}
.drag-item:active {
  cursor: grabbing;
  transform: scale(0.98);
  border-color: var(--accent);
}
.drag-handle {
  color: var(--text3);
  font-size: 16px;
  user-select: none;
}
.drag-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.drag-info strong {
  font-size: 13px;
  color: var(--text);
}
.req-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--red);
  background: rgba(248, 81, 73, 0.12);
  padding: 1px 5px;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
}
.opt-badge {
  font-size: 9px;
  font-weight: 700;
  color: var(--accent);
  background: rgba(88, 166, 255, 0.12);
  padding: 1px 5px;
  border-radius: 4px;
  width: fit-content;
  text-transform: uppercase;
}
.drag-action {
  display: flex;
  align-items: center;
}

/* ─── Themes (Preview) ─────────────────────────────────────────── */
/* 1. Theme: classic */
.cx-theme-classic :deep(.mc-head) { background: var(--primary) !important; }
.cx-theme-classic :deep(.mc-title), .cx-theme-classic :deep(.mc-sub) { color: var(--btn-color) !important; }

/* 2. Theme: modern */
.w-popup.cx-theme-modern, .c-popup.cx-theme-modern { border-radius: 24px !important; box-shadow: 0 20px 48px rgba(0,0,0,0.12) !important; border: 1px solid #eef2f6 !important; }
.cx-theme-modern :deep(.mc-head) { background: transparent !important; border-bottom: none !important; padding: 20px 20px 6px !important; }
.cx-theme-modern :deep(.mc-title) { color: var(--primary) !important; font-size: 15px !important; }
.cx-theme-modern :deep(.mc-sub) { color: #6b7280 !important; font-size: 12px !important; }
.cx-theme-modern :deep(.mc-close) { background: #f3f4f6 !important; color: #4b5563 !important; }
.cx-theme-modern :deep(.mc-agent) { background: #f8fafc !important; border-bottom: none !important; margin: 0 20px !important; border-radius: 12px !important; padding: 10px !important; }
.cx-theme-modern :deep(.mc-body) { padding: 14px 20px 20px !important; }
.cx-theme-modern :deep(.mc-cta) { border-radius: 10px !important; }

/* 3. Theme: compact */
.w-popup.cx-theme-compact, .c-popup.cx-theme-compact { width: 220px !important; border-radius: 18px !important; }
.cx-theme-compact :deep(.mc-head) { background: transparent !important; padding: 14px 14px 2px !important; text-align: center !important; }
.cx-theme-compact :deep(.mc-title) { font-size: 13px !important; color: #111 !important; padding-right: 0 !important; }
.cx-theme-compact :deep(.mc-sub) { display: none !important; }
.cx-theme-compact :deep(.mc-agent) { display: none !important; }
.cx-theme-compact :deep(.mc-body) { padding: 8px 14px 14px !important; }
.cx-theme-compact :deep(.mc-inp) { padding: 6px 8px !important; font-size: 13px !important; }
.cx-theme-compact :deep(.mc-iti) { height: 34px !important; }
.cx-theme-compact :deep(.mc-iti-num) { line-height: 20px !important; }
.cx-theme-compact :deep(.mc-cta) { padding: 8px !important; font-size: 13px !important; }

/* 4. Theme: split */
.w-popup.cx-theme-split, .c-popup.cx-theme-split {
  display: grid !important;
  grid-template-columns: 40% 60% !important;
  grid-template-rows: auto 1fr auto !important;
  width: 460px !important;
  max-width: none !important;
  height: auto !important;
  min-height: 310px !important;
  align-items: stretch !important;
}
.cx-theme-split :deep(.mc-head) {
  grid-column: 2 !important;
  grid-row: 1 !important;
  background: transparent !important;
  padding: 16px 16px 6px !important;
}
.cx-theme-split :deep(.mc-title) { color: #111 !important; font-size: 14px !important; }
.cx-theme-split :deep(.mc-sub) { color: #6b7280 !important; font-size: 12px !important; }
.cx-theme-split :deep(.mc-close) { background: #f3f4f6 !important; color: #4b5563 !important; z-index: 5 !important; }
.cx-theme-split :deep(.mc-agent) {
  grid-column: 1 !important;
  grid-row: 1 / span 3 !important;
  height: 100% !important;
  background: var(--primary) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px 14px !important;
  border-bottom: none !important;
  margin: 0 !important;
  border-radius: 0 !important;
}
.cx-theme-split :deep(.mc-av) { border-color: var(--btn-color) !important; width: 54px !important; height: 54px !important; border-radius: 50% !important; }
.cx-theme-split :deep(.mc-av-name) { color: var(--btn-color) !important; margin-top: 6px !important; font-size: 13px !important; }
.cx-theme-split :deep(.mc-av-sub) { color: var(--btn-color) !important; opacity: 0.85 !important; margin-bottom: 0 !important; font-size: 11px !important; border: none !important; background: transparent !important; }
.cx-theme-split :deep(.mc-body) {
  grid-column: 2 !important;
  grid-row: 2 !important;
  padding: 4px 16px 16px !important;
}
.cx-theme-split :deep(.mc-success) {
  grid-column: 2 !important;
  grid-row: 2 !important;
  padding: 16px !important;
}
.cx-theme-split :deep(.mc-brand) {
  grid-column: 2 !important;
  grid-row: 3 !important;
  background: transparent !important;
  padding: 0 0 10px !important;
}

/* 5. Theme: neon */
.w-popup.cx-theme-neon, .c-popup.cx-theme-neon { background: #0f172a !important; border: 1px solid var(--primary) !important; box-shadow: 0 0 25px rgba(var(--primary), 0.5) !important; }
.cx-theme-neon :deep(.mc-head) { background: rgba(255,255,255,0.03) !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
.cx-theme-neon :deep(.mc-title) { color: #f8fafc !important; }
.cx-theme-neon :deep(.mc-sub) { color: #94a3b8 !important; }
.cx-theme-neon :deep(.mc-close) { background: rgba(255,255,255,0.08) !important; color: #f8fafc !important; }
.cx-theme-neon :deep(.mc-agent) { background: rgba(255,255,255,0.02) !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
.cx-theme-neon :deep(.mc-av-name) { color: #f8fafc !important; }
.cx-theme-neon :deep(.mc-av-sub) { color: #94a3b8 !important; }
.cx-theme-neon :deep(.mc-field label) { color: var(--primary) !important; }
.cx-theme-neon :deep(.mc-inp) { background: transparent !important; border: none !important; border-bottom: 2px solid #334155 !important; border-radius: 0 !important; color: #f8fafc !important; padding: 6px 0 !important; }
.cx-theme-neon :deep(.mc-iti) { background: transparent !important; border: none !important; border-bottom: 2px solid #334155 !important; border-radius: 0 !important; color: #f8fafc !important; }
.cx-theme-neon :deep(.mc-iti-flag) { border-right: none !important; }
.cx-theme-neon :deep(.mc-brand) { background: #0f172a !important; color: #475569 !important; }
.cx-theme-neon :deep(.mc-ok-title) { color: #f8fafc !important; }
.cx-theme-neon :deep(.mc-ok-msg) { color: #94a3b8 !important; }

/* 6. Theme: glass (Glassmorphism) */
.w-popup.cx-theme-glass, .c-popup.cx-theme-glass {
  background: rgba(255,255,255,0.18) !important;
  backdrop-filter: blur(18px) !important;
  -webkit-backdrop-filter: blur(18px) !important;
  border: 1.5px solid rgba(255,255,255,0.35) !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.22) !important;
}
.cx-theme-glass :deep(.mc-head) { background: rgba(255,255,255,0.08) !important; border-bottom: 1px solid rgba(255,255,255,0.2) !important; }
.cx-theme-glass :deep(.mc-title) { color: #fff !important; text-shadow: 0 1px 4px rgba(0,0,0,0.3) !important; }
.cx-theme-glass :deep(.mc-sub) { color: rgba(255,255,255,0.82) !important; }
.cx-theme-glass :deep(.mc-close) { background: rgba(255,255,255,0.25) !important; color: #fff !important; }
.cx-theme-glass :deep(.mc-agent) { background: rgba(255,255,255,0.06) !important; border-bottom: 1px solid rgba(255,255,255,0.15) !important; }
.cx-theme-glass :deep(.mc-av-name) { color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.4) !important; }
.cx-theme-glass :deep(.mc-av-sub) { color: rgba(255,255,255,0.75) !important; }
.cx-theme-glass :deep(.mc-body) { background: transparent !important; }
.cx-theme-glass :deep(.mc-field label) { color: rgba(255,255,255,0.7) !important; }
.cx-theme-glass :deep(.mc-inp) { background: rgba(255,255,255,0.18) !important; border: 1.5px solid rgba(255,255,255,0.3) !important; color: #fff !important; border-radius: 8px !important; }
.cx-theme-glass :deep(.mc-iti) { background: rgba(255,255,255,0.18) !important; border: 1.5px solid rgba(255,255,255,0.3) !important; }
.cx-theme-glass :deep(.mc-iti-flag) { background: transparent !important; color: #fff !important; border-right: 1px solid rgba(255,255,255,0.2) !important; }
.cx-theme-glass :deep(.mc-brand) { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.55) !important; }
.cx-theme-glass :deep(.mc-ok-title) { color: #fff !important; }
.cx-theme-glass :deep(.mc-ok-msg) { color: rgba(255,255,255,0.75) !important; }

/* 7. Theme: dark (Dark Elegance) */
.w-popup.cx-theme-dark, .c-popup.cx-theme-dark { background: #111827 !important; border: 1px solid #1f2937 !important; box-shadow: 0 32px 80px rgba(0,0,0,0.6) !important; }
.cx-theme-dark :deep(.mc-head) { background: linear-gradient(135deg, #1f2937, #111827) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
.cx-theme-dark :deep(.mc-title) { color: #f9fafb !important; }
.cx-theme-dark :deep(.mc-sub) { color: #9ca3af !important; }
.cx-theme-dark :deep(.mc-close) { background: rgba(255,255,255,0.08) !important; color: #f9fafb !important; }
.cx-theme-dark :deep(.mc-agent) { background: #1a2235 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
.cx-theme-dark :deep(.mc-av-name) { color: #f9fafb !important; }
.cx-theme-dark :deep(.mc-av-sub) { color: #6b7280 !important; }
.cx-theme-dark :deep(.mc-body) { background: #111827 !important; }
.cx-theme-dark :deep(.mc-field label) { color: #6b7280 !important; }
.cx-theme-dark :deep(.mc-inp) { background: #1f2937 !important; border: 1.5px solid #374151 !important; color: #f9fafb !important; border-radius: 8px !important; }
.cx-theme-dark :deep(.mc-iti) { background: #1f2937 !important; border: 1.5px solid #374151 !important; }
.cx-theme-dark :deep(.mc-iti-flag) { background: transparent !important; color: #f9fafb !important; border-right: 1px solid #374151 !important; }
.cx-theme-dark :deep(.mc-brand) { background: #111827 !important; color: #4b5563 !important; }
.cx-theme-dark :deep(.mc-ok-title) { color: #f9fafb !important; }
.cx-theme-dark :deep(.mc-ok-msg) { color: #9ca3af !important; }

/* 8. Theme: wave (Gradient Wave) */
.w-popup.cx-theme-wave, .c-popup.cx-theme-wave { background: #fff !important; overflow: visible !important; }
.cx-theme-wave :deep(.mc-head) {
  background: linear-gradient(135deg, var(--tw-gradient-from, #7c3aed) 0%, var(--tw-gradient-to, #0b4526) 100%) !important;
  padding-bottom: 26px !important;
  border-radius: 0 !important;
  position: relative !important;
}
.cx-theme-wave :deep(.mc-title) { color: #fff !important; }
.cx-theme-wave :deep(.mc-sub) { color: rgba(255,255,255,0.85) !important; }
.cx-theme-wave :deep(.mc-close) { background: rgba(255,255,255,0.25) !important; color: #fff !important; }
.cx-theme-wave :deep(.mc-agent) { background: #fafafa !important; border-bottom: 1px solid #f0f0f0 !important; margin-top: -2px !important; }

/* 9. Theme: floating (Floating Card) */
.w-popup.cx-theme-floating, .c-popup.cx-theme-floating {
  background: #fff !important;
  border-radius: 24px !important;
  box-shadow: 0 40px 100px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08) !important;
  border: none !important;
  overflow: hidden !important;
}
/* Colored top accent stripe */
.cx-theme-floating :deep(.mc-head) {
  background: var(--primary) !important;
  text-align: center !important;
  padding: 20px 20px 36px !important;
  border-bottom: none !important;
  clip-path: ellipse(100% 80% at 50% 0%) !important;
  position: relative !important;
  z-index: 1 !important;
  will-change: clip-path !important;
  transform: translateZ(0) !important;
}
.cx-theme-floating :deep(.mc-title) { color: var(--btn-color, #fff) !important; font-size: 15px !important; font-weight: 800 !important; padding-right: 0 !important; }
.cx-theme-floating :deep(.mc-sub) { color: rgba(255,255,255,0.8) !important; font-size: 11px !important; }
.cx-theme-floating :deep(.mc-close) { background: rgba(255,255,255,0.2) !important; color: #fff !important; }
/* Large centered avatar pushed up over the stripe boundary */
.cx-theme-floating :deep(.mc-agent) {
  background: transparent !important;
  border-bottom: none !important;
  padding: 0 14px 14px !important;
  margin-top: -28px !important;
  position: relative !important;
  z-index: 5 !important;
}
.cx-theme-floating :deep(.mc-av-container) {
  width: 60px !important;
  height: 60px !important;
  margin: 0 auto 6px !important;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.22)) !important;
}
.cx-theme-floating :deep(.mc-av) { width: 60px !important; height: 60px !important; border: 3px solid #fff !important; }
.cx-theme-floating :deep(.mc-av-name) { color: #111 !important; font-size: 13px !important; font-weight: 700 !important; }
.cx-theme-floating :deep(.mc-av-sub) { color: #6b7280 !important; font-size: 11px !important; margin-bottom: 4px !important; }
.cx-theme-floating :deep(.mc-body) { padding: 2px 20px 20px !important; }
.cx-theme-floating :deep(.mc-inp) { border-radius: 12px !important; background: #f9fafb !important; border: 1.5px solid #e5e7eb !important; }
.cx-theme-floating :deep(.mc-iti) { border-radius: 12px !important; border: 1.5px solid #e5e7eb !important; }
.cx-theme-floating :deep(.mc-cta) { border-radius: 14px !important; }
.cx-theme-floating :deep(.mc-brand) { border-top: 1px solid #f3f4f6 !important; padding-top: 8px !important; }

/* 10. Theme: corporate (Corporate Pro) */
.w-popup.cx-theme-corporate, .c-popup.cx-theme-corporate {
  background: #fff !important;
  border-radius: 8px !important;
  border: none !important;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18) !important;
  overflow: hidden !important;
}
/* Top colored accent bar */
.cx-theme-corporate :deep(.mc-head) {
  background: var(--primary) !important;
  padding: 16px 16px 14px !important;
  border-bottom: none !important;
  border-left: none !important;
  position: relative !important;
}
.cx-theme-corporate :deep(.mc-head)::before {
  content: '' !important;
  position: absolute !important;
  left: 0 !important; top: 0 !important; bottom: 0 !important;
  width: 5px !important;
  background: rgba(255,255,255,0.3) !important;
}
.cx-theme-corporate :deep(.mc-title) { color: var(--btn-color, #fff) !important; font-size: 13px !important; font-weight: 800 !important; letter-spacing: -0.2px !important; padding-right: 28px !important; }
.cx-theme-corporate :deep(.mc-sub) { color: rgba(255,255,255,0.75) !important; font-size: 11px !important; }
.cx-theme-corporate :deep(.mc-close) { background: rgba(255,255,255,0.2) !important; color: #fff !important; }
/* Horizontal agent row */
.cx-theme-corporate :deep(.mc-agent) {
  background: #f8fafc !important;
  border-bottom: 2px solid #e5e7eb !important;
  border-left: 5px solid var(--primary) !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 10px !important;
  text-align: left !important;
  padding: 10px 14px !important;
}
.cx-theme-corporate :deep(.mc-av-container) { width: 38px !important; height: 38px !important; flex-shrink: 0 !important; margin: 0 !important; }
.cx-theme-corporate :deep(.mc-av) { width: 38px !important; height: 38px !important; }
.cx-theme-corporate :deep(.mc-av-name) { font-size: 12px !important; font-weight: 700 !important; text-align: left !important; color: #111 !important; }
.cx-theme-corporate :deep(.mc-av-sub) { font-size: 10px !important; text-align: left !important; margin-bottom: 0 !important; color: #6b7280 !important; }
/* Form area with left accent */
.cx-theme-corporate :deep(.mc-body) {
  padding: 12px 14px 14px !important;
  border-left: 5px solid #f3f4f6 !important;
}
.cx-theme-corporate :deep(.mc-field label) { color: #6b7280 !important; font-weight: 700 !important; letter-spacing: 0.3px !important; }
.cx-theme-corporate :deep(.mc-inp) { border-radius: 4px !important; border: 1px solid #d1d5db !important; background: #fafafa !important; }
.cx-theme-corporate :deep(.mc-iti) { border-radius: 4px !important; border: 1px solid #d1d5db !important; }
.cx-theme-corporate :deep(.mc-cta) { border-radius: 4px !important; font-weight: 800 !important; letter-spacing: 0.5px !important; }
.cx-theme-corporate :deep(.mc-brand) { border-left: 5px solid #f3f4f6 !important; }

/* ─── FAB Preview Mockup Selector Styles ─── */
.fab-preview-mock {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg3) !important;
}
.mock-fab-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}
.mock-fab-wrap {
  position: relative;
}

/* Mock FAB Overrides */
.mock-fab-wrap.cx-fab-squircle .mock-fab-btn {
  border-radius: 8px !important;
}
.mock-fab-wrap.cx-fab-pill .mock-fab-btn {
  width: auto !important;
  padding: 0 10px !important;
  border-radius: 20px !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px;
}
.mock-fab-wrap.cx-fab-pill .mock-fab-btn::after {
  content: 'Call';
  font-size: 8px;
  font-weight: 700;
  color: var(--btn-color, #fff);
  white-space: nowrap;
}
.mock-fab-wrap.cx-fab-dock .mock-fab-btn {
  border-radius: 4px 4px 0 0 !important;
  width: auto !important;
  padding: 0 10px !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
}
.mock-fab-wrap.cx-fab-dock .mock-fab-btn::after {
  content: 'Call';
  font-size: 8px;
  font-weight: 700;
  color: var(--btn-color, #fff);
  margin-left: 4px;
}
.mock-fab-wrap.cx-fab-glow .mock-fab-btn {
  box-shadow: 0 0 0 0 rgba(88,166,255, 0.5);
  animation: cx-fab-glow-anim 2s infinite !important;
}
.mock-fab-wrap.cx-fab-double-ring .mock-fab-btn {
  animation: cx-fab-pulse-slow 3s infinite;
}
.mock-fab-wrap.cx-fab-double-ring::before,
.mock-fab-wrap.cx-fab-double-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid var(--accent);
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
.mock-fab-wrap.cx-fab-double-ring::before {
  animation: cx-ring-expand-1 3s infinite;
}
.mock-fab-wrap.cx-fab-double-ring::after {
  animation: cx-ring-expand-2 3s infinite;
}
.mock-fab-wrap.cx-fab-glass .mock-fab-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(4px) saturate(180%);
  border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
}
.mock-fab-wrap.cx-fab-glass .mock-fab-btn svg {
  fill: #fff !important;
}
.mock-fab-wrap.cx-fab-minimal .mock-fab-btn {
  transform: scale(0.75) !important;
}
.mock-fab-wrap.cx-fab-left-tab .mock-fab-btn {
  border-radius: 0 6px 6px 0 !important;
  padding: 0 8px !important;
  width: auto !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px;
}
.mock-fab-wrap.cx-fab-left-tab .mock-fab-btn::after {
  content: 'Call';
  font-size: 8px;
  font-weight: 700;
  color: var(--btn-color, #fff);
}
.mock-fab-wrap.cx-fab-right-tab .mock-fab-btn {
  border-radius: 6px 0 0 6px !important;
  padding: 0 8px !important;
  width: auto !important;
  height: 24px !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px;
}
.mock-fab-wrap.cx-fab-right-tab .mock-fab-btn::after {
  content: 'Call';
  font-size: 8px;
  font-weight: 700;
  color: var(--btn-color, #fff);
}

/* ─── Browser Frame Live Preview Overrides ─── */
.w-corner.cx-fab-squircle .w-fab {
  border-radius: 16px !important;
}
.w-corner.cx-fab-pill .w-fab {
  width: auto !important;
  padding: 0 20px !important;
  border-radius: 50px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px;
}
.w-corner.cx-fab-pill .w-fab::after {
  content: 'Call Us';
  font-size: 13px;
  font-weight: 700;
  color: var(--btn-color, #fff);
  white-space: nowrap;
}
.w-corner.cx-fab-dock {
  bottom: 0 !important;
  right: 32px !important;
  left: auto !important;
  top: auto !important;
}
.w-corner.cx-fab-dock .w-fab {
  height: 48px !important;
  width: auto !important;
  padding: 0 24px !important;
  border-radius: 12px 12px 0 0 !important;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.15) !important;
  display: flex !important;
  align-items: center !important;
}
.w-corner.cx-fab-dock .w-fab::after {
  content: 'Call Us';
  font-size: 13px;
  font-weight: 700;
  color: var(--btn-color, #fff);
  margin-left: 8px;
}
.w-corner.cx-fab-glow .w-fab {
  animation: cx-fab-glow-anim 2s infinite !important;
}
.w-corner.cx-fab-double-ring .w-fab {
  animation: cx-fab-pulse-slow 3s infinite !important;
}
.w-corner.cx-fab-double-ring::before,
.w-corner.cx-fab-double-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--primary);
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
.w-corner.cx-fab-double-ring::before {
  animation: cx-ring-expand-1 3s infinite !important;
}
.w-corner.cx-fab-double-ring::after {
  animation: cx-ring-expand-2 3s infinite !important;
}
.w-corner.cx-fab-glass .w-fab {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(14px) saturate(180%) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
}
.w-corner.cx-fab-glass .w-fab svg {
  fill: #fff !important;
}
.w-corner.cx-fab-minimal .w-fab {
  transform: scale(0.75) !important;
  box-shadow: 0 3px 12px rgba(0,0,0,0.2) !important;
}
.w-corner.cx-fab-minimal .w-fab:hover {
  transform: scale(0.85) !important;
}
.w-corner.cx-fab-left-tab {
  left: 0 !important;
  right: auto !important;
  top: 50% !important;
  bottom: auto !important;
  transform: translateY(-50%) !important;
}
.w-corner.cx-fab-left-tab .w-fab {
  height: 44px !important;
  width: auto !important;
  padding: 0 16px !important;
  border-radius: 0 10px 10px 0 !important;
  box-shadow: 4px 0 16px rgba(0,0,0,0.18) !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px;
}
.w-corner.cx-fab-left-tab .w-fab::after {
  content: 'Call Us';
  font-size: 12px;
  font-weight: 700;
  color: var(--btn-color, #fff);
  white-space: nowrap;
}
.w-corner.cx-fab-right-tab {
  right: 0 !important;
  left: auto !important;
  top: 50% !important;
  bottom: auto !important;
  transform: translateY(-50%) !important;
}
.w-corner.cx-fab-right-tab .w-fab {
  height: 44px !important;
  width: auto !important;
  padding: 0 16px !important;
  border-radius: 10px 0 0 10px !important;
  box-shadow: -4px 0 16px rgba(0,0,0,0.18) !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px;
}
.w-corner.cx-fab-right-tab .w-fab::after {
  content: 'Call Us';
  font-size: 12px;
  font-weight: 700;
  color: var(--btn-color, #fff);
  white-space: nowrap;
}

/* Animations */
@keyframes cx-fab-glow-anim {
  0% { box-shadow: 0 0 0 0 rgba(88,166,255, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(88,166,255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(88,166,255, 0); }
}
@keyframes cx-fab-pulse-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes cx-ring-expand-1 {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes cx-ring-expand-2 {
  0% { transform: scale(1); opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ─── Tooltip Preview Mockup Selector Styles ─── */
.tooltip-preview-mock {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}
.mock-tooltip-bubble {
  position: relative;
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 8px;
  min-width: 60px;
  text-align: center;
}
.mock-tooltip-bubble::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
}

/* Tooltip Styles (Mirroring widget-template.js) */
.cx-tooltip-classic { background: #fff; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,.14); }
.cx-tooltip-classic::after { border-top-color: #fff; border-bottom-color: #fff; border-bottom: none; }

.cx-tooltip-glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #111; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border: 1px solid rgba(255, 255, 255, 0.5); }
.cx-tooltip-glass::after { border-top-color: rgba(255, 255, 255, 0.7); border-bottom: none; }

.cx-tooltip-solid { background: var(--primary); color: var(--btn-color); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.cx-tooltip-solid::after { border-top-color: var(--primary); border-bottom: none; }

.cx-tooltip-dark { background: #1f2937; color: #f9fafb; box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
.cx-tooltip-dark::after { border-top-color: #1f2937; border-bottom: none; }

.cx-tooltip-neon { background: #000; color: #fff; border: 1px solid var(--primary); box-shadow: 0 0 10px var(--primary); }
.cx-tooltip-neon::after { border-top-color: #000; border-bottom: none; }

.cx-tooltip-gradient { background: linear-gradient(135deg, var(--primary), #9333ea); color: rgba(255,255,255,0.95); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
.cx-tooltip-gradient::after { border-top-color: var(--primary); border-bottom: none; }

.cx-tooltip-border { background: #fff; color: #333; border: 2px solid var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 12px; }
.cx-tooltip-border::after { border-top-color: var(--primary); border-bottom: none; }

.cx-tooltip-shadow { background: #fff; color: #111; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.1); }
.cx-tooltip-shadow::after { border-top-color: #fff; border-bottom: none; }

.cx-tooltip-minimal { background: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7; box-shadow: none; border-radius: 4px; }
.cx-tooltip-minimal::after { display: none; }

.cx-tooltip-bubble { background: var(--primary); color: var(--btn-color); box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 20px 20px 0 20px; }
.cx-tooltip-bubble::after { border-top-color: var(--primary); border-bottom: none; }

/* In-preview Tooltip Overrides */
.w-tip.cx-tooltip-classic { background: #fff; color: #333; box-shadow: 0 6px 24px rgba(0,0,0,.14); border: none; }
.w-tip.cx-tooltip-classic .w-tip-arrow { border-top-color: #fff; border-bottom-color: #fff; }
.w-tip.cx-tooltip-classic .w-tip-x { color: #bbb; }

.w-tip.cx-tooltip-glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #111; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.5); }
.w-tip.cx-tooltip-glass .w-tip-arrow { border-top-color: rgba(255, 255, 255, 0.7); border-bottom-color: rgba(255, 255, 255, 0.7); }
.w-tip.cx-tooltip-glass .w-tip-x { color: #777; }

.w-tip.cx-tooltip-solid { background: var(--primary); color: var(--btn-color); box-shadow: 0 6px 20px rgba(0,0,0,0.2); border: none; }
.w-tip.cx-tooltip-solid .w-tip-arrow { border-top-color: var(--primary); border-bottom-color: var(--primary); }
.w-tip.cx-tooltip-solid .w-tip-x { color: var(--btn-color); opacity: 0.8; }

.w-tip.cx-tooltip-dark { background: #1f2937; color: #f9fafb; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); border: none; }
.w-tip.cx-tooltip-dark .w-tip-arrow { border-top-color: #1f2937; border-bottom-color: #1f2937; }
.w-tip.cx-tooltip-dark .w-tip-x { color: #9ca3af; }

.w-tip.cx-tooltip-neon { background: #000; color: #fff; border: 1px solid var(--primary); box-shadow: 0 0 15px var(--primary); }
.w-tip.cx-tooltip-neon .w-tip-arrow { width: 10px; height: 10px; background: #000; border: none; border-bottom: 1px solid var(--primary); border-right: 1px solid var(--primary); transform: rotate(45deg); bottom: -6px; right: 20px; box-shadow: 4px 4px 8px -3px var(--primary); }
.w-tip.cx-tooltip-neon .w-tip-x { color: #888; }

.w-tip.cx-tooltip-gradient { background: linear-gradient(135deg, var(--primary), #9333ea); color: rgba(255,255,255,0.95); box-shadow: 0 6px 20px rgba(0,0,0,0.25); border: none; }
.w-tip.cx-tooltip-gradient .w-tip-arrow { border-top-color: var(--primary); border-bottom-color: var(--primary); }
.w-tip.cx-tooltip-gradient .w-tip-x { color: rgba(255,255,255,0.8); }

.w-tip.cx-tooltip-border { background: #fff; color: #333; border: 2px solid var(--primary); box-shadow: 0 6px 16px rgba(0,0,0,0.1); border-radius: 12px; }
.w-tip.cx-tooltip-border .w-tip-arrow { width: 10px; height: 10px; background: #fff; border: none; border-bottom: 2px solid var(--primary); border-right: 2px solid var(--primary); transform: rotate(45deg); bottom: -6px; right: 20px; }
.w-tip.cx-tooltip-border .w-tip-x { color: #888; }

.w-tip.cx-tooltip-shadow { background: #fff; color: #111; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1); border: none; }
.w-tip.cx-tooltip-shadow .w-tip-arrow { border-top-color: #fff; border-bottom-color: #fff; }
.w-tip.cx-tooltip-shadow .w-tip-x { color: #666; }

.w-tip.cx-tooltip-minimal { background: #f4f4f5; color: #3f3f46; border: 1px solid #e4e4e7; box-shadow: none; border-radius: 4px; }
.w-tip.cx-tooltip-minimal .w-tip-arrow { display: none; }
.w-tip.cx-tooltip-minimal .w-tip-x { color: #a1a1aa; }

.w-tip.cx-tooltip-bubble { background: var(--primary); color: var(--btn-color); box-shadow: 0 6px 16px rgba(0,0,0,0.2); border-radius: 20px 20px 0 20px; border: none; }
.w-tip.cx-tooltip-bubble .w-tip-arrow { border-top-color: var(--primary); border-bottom-color: var(--primary); }
.w-tip.cx-tooltip-bubble .w-tip-x { color: var(--btn-color); opacity: 0.7; }
</style>
