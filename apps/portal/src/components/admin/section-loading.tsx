export function AdminSectionLoading() {
  return (
    <div aria-busy="true" className="grid animate-pulse gap-7">
      <div className="grid gap-3">
        <div className="h-8 w-48 rounded-md bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded-md bg-slate-200" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-5">
          <div className="h-4 w-full rounded-md bg-slate-100" />
          <div className="h-4 w-full rounded-md bg-slate-100" />
          <div className="h-4 w-2/3 rounded-md bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
