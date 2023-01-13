project('force-quit-dialog-extension',
  version: '3.38.0',
  meson_version: '>= 0.50.0'
)

sources = ['extension.js']
extra_sources = ['COPYING']

uuid = 'force-quit-dialog-extension@endlessm.com'

datadir = get_option('datadir')
extensiondir = join_paths(datadir, 'gnome-shell', 'extensions')
installdir = join_paths(extensiondir, uuid)

metaconf = configuration_data()
metaconf.set('uuid', uuid)

meta = [
  configure_file(
    input: 'metadata.json.in',
    output: 'metadata.json',
    configuration: metaconf
  )
]

install_subdir('schemas', install_dir: installdir)
install_data(sources + extra_sources + meta, install_dir: installdir)

sassc = find_program('sassc', required: true)
sassc_opts = [ '-a', '-M', '-t', 'compact' ]
styles = custom_target(
  'styles',
  input: 'stylesheet.scss',
  output: 'stylesheet.css',
  command: [ sassc, sassc_opts, '@INPUT@', '@OUTPUT@' ],
  depend_files: 'stylesheet.scss',
  install: true,
  install_dir: installdir,
  build_by_default: true)

extension_tool = find_program('gnome-extensions', required: false)
if extension_tool.found()
  builddir = meson.current_build_dir()
  srcdir = meson.current_source_dir()

  command = [
    extension_tool,
    'pack',
    '--force',
    '--out-dir=@0@'.format(builddir),
    '--extra-source=@0@/metadata.json'.format(builddir)
  ]

  foreach s : extra_sources
    command += '--extra-source=@0@'.format(s)
  endforeach

  command += srcdir

  run_target('zip-file', command: command)
endif

i18n = import('i18n')
subdir('po')
