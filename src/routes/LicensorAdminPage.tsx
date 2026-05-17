import { useState } from 'react'
import { DisclaimerBox } from '../components/DisclaimerBox'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { coreDisclaimer, coPhotoRequests, getCelebrityById, usageScopeLabels } from '../data/mockData'
import type { CoPhotoRequest } from '../types'

export function LicensorAdminPage() {
  const [requests, setRequests] = useState<CoPhotoRequest[]>(coPhotoRequests)

  function updateRequest(id: string, status: CoPhotoRequest['status']) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              approvedAt: status === 'approved' ? new Date().toISOString() : request.approvedAt,
            }
          : request,
      ),
    )
  }

  return (
    <Layout>
      <section className="page-heading">
        <p className="eyebrow">Licensor Console</p>
        <h1>授权方后台</h1>
        <p>处理待授权请求，第一版使用本地 mock state 演示审批流程。</p>
      </section>

      <section className="admin-table" aria-label="待授权请求列表">
        <div className="admin-table__head">
          <span>请求编号</span>
          <span>用户匿名 ID</span>
          <span>合影对象</span>
          <span>用途</span>
          <span>授权价格</span>
          <span>授权有效期</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        {requests.map((request) => {
          const celebrity = getCelebrityById(request.celebrityId)
          return (
            <article key={request.id} className="admin-row">
              <span data-label="请求编号">{request.id}</span>
              <span data-label="用户匿名 ID">{request.userIdHash}</span>
              <span data-label="合影对象">{celebrity?.displayName ?? '未知对象'}</span>
              <span data-label="用途">{usageScopeLabels[request.usageScope]}</span>
              <span data-label="授权价格">¥{request.price.toLocaleString('zh-CN')}</span>
              <span data-label="授权有效期">{new Date(request.expiresAt).toLocaleDateString('zh-CN')}</span>
              <span data-label="状态">
                <StatusBadge status={request.status} />
              </span>
              <span className="row-actions" data-label="操作">
                <button
                  type="button"
                  disabled={request.status !== 'pending'}
                  onClick={() => updateRequest(request.id, 'approved')}
                >
                  同意授权
                </button>
                <button
                  type="button"
                  disabled={request.status !== 'pending'}
                  onClick={() => updateRequest(request.id, 'rejected')}
                >
                  拒绝授权
                </button>
              </span>
            </article>
          )
        })}
      </section>

      <div className="admin-note">
        <a className="secondary-button" href="/result/AICOPHOTO-2026-000001">
          查看已生成证书示例
        </a>
        <DisclaimerBox>{coreDisclaimer}</DisclaimerBox>
      </div>
    </Layout>
  )
}
