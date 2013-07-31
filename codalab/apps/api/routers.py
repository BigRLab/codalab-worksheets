from rest_framework import routers
from . import views
from django.conf.urls import patterns, url
router = routers.DefaultRouter()

router.register(r'competition/participant', views.CompetitionParticipantAPIViewSet)
router.register(r'competition', views.CompetitionAPIViewSet)

router.register(r'competition/submission', views.CompetitionSubmissionViewSet)

router.register(r'defaultcontent', views.DefaultContentViewSet)

urlpatterns = router.urls

urlpatterns += (

    url(r'^competition/(?P<pk>\d+)/phases/(?P<phasenumber>\d+)$',views.competitionphase_retrieve,name='api_competitionphase'),
    url(r'^competition/(?P<pk>\d+)/phases/$',views.competitionphase_list,name='api_competitionphases_list'),

    url(r'^competitionphases/(?P<competition_id>\d+)/$',views.CompetitionPhaseEditView.as_view(), name='api_competitionphases'),
    
    url(r'^competition/(?P<competition_id>\d+)/pages/(?P<category>[a-zA-Z][\w\d\-\_]*)/$', views.competition_page_list, name='api_competition_page_list'),
    url(r'^competition/(?P<competition_id>\d+)/pages/(?P<pk>\d+)$', views.competition_page, name='api_competition_page'),
    url(r'^competition/(?P<competition_id>\d+)/pages/$', views.competition_page_list, name='api_competition_page_list'),
    url(r'^competition/(?P<pk>\d+)/pages/(?P<entity_label>\w[\w\d\-\_]+)/$', views.competition_page_list, name='api_competition_page_list'),
)
