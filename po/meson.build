localedir = join_paths(installdir, 'locale')

i18n.gettext(meson.project_name(),
  args: ['--from-code=UTF-8', '-k_', '-kN_'],
  preset: 'glib',
  install_dir: localedir)
