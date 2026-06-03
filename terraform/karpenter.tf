module "karpenter" {
  source  = "terraform-aws-modules/eks/aws//modules/karpenter"
  version = "~> 20.0"

  cluster_name = module.eks.cluster_name

  enable_v1_permissions = true

  enable_pod_identity             = true
  create_pod_identity_association = true

  enable_spot_termination = true  # thêm dòng này — tạo SQS queue

  node_iam_role_additional_policies = {
    AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  }
}

output "karpenter_node_role" {
  value = module.karpenter.node_iam_role_name
}

output "karpenter_iam_role_arn" {
  value = module.karpenter.iam_role_arn
}